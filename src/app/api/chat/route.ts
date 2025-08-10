import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { buildMemoryEnhancedPrompt, type MemoryContext } from '@/lib/therapy-prompts';
import { logger, createRequestLogger } from '@/lib/logger';
import { validateApiAuth, createAuthErrorResponse } from '@/lib/api-auth';
import { handleAIError } from '@/lib/error-utils';
import { supportsWebSearch, shouldUseWebSearch, selectModelForRequirements, shouldUseDeepThinking } from '@/lib/model-utils';

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  let model = 'openai/gpt-oss-20b'; // Default to fast model for regular chat
  
  try {
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized chat request', { ...requestContext, error: authResult.error });
      return createAuthErrorResponse(authResult.error || 'Authentication required');
    }
    
    logger.info('Chat request received', requestContext);
    
    const requestData = await request.json();
    const { 
      messages, 
      apiKey, 
      temperature = 0.6,
      maxTokens = 30000,
      topP = 1,
      browserSearchEnabled = true,
      reasoningEffort = 'medium',
      sessionId
    } = requestData;
    
    // ROBUST MODEL SELECTION - Requirement-based rather than text-guessing
    const lastMessage = messages[messages.length - 1]?.content || '';
    const forceModel = requestData.model; // Allow manual model override
    
    // Extract conversation context for better analysis
    const conversationContext = messages.slice(-3).map((m: { content: string }) => m.content);
    
    let modelSelection;
    let webSearchDetection;
    let deepThinkingDetection;
    
    if (forceModel) {
      // Manual override - respect user choice
      modelSelection = { 
        modelId: forceModel, 
        displayName: forceModel, 
        reason: 'Manual model override by user' 
      };
      webSearchDetection = { 
        shouldUseWebSearch: supportsWebSearch(forceModel) && browserSearchEnabled,
        reason: 'Based on manual model selection',
        confidence: 'high' as const
      };
      deepThinkingDetection = {
        shouldUseDeepThinking: false,
        reason: 'Skipped due to manual model override',
        confidence: 'high' as const
      };
    } else {
      // 3-TIER PRIORITY SYSTEM: Stateless per-message evaluation
      
      // PRIORITY 1: Deep thinking detection (highest priority)
      const deepThinkingDetection = shouldUseDeepThinking(lastMessage);
      
      if (deepThinkingDetection.shouldUseDeepThinking) {
        // Deep analysis requested → use 120B without web search tools
        modelSelection = {
          modelId: 'openai/gpt-oss-120b',
          displayName: 'GPT OSS 120B (Deep Analysis)',
          reason: `Deep thinking requested: ${deepThinkingDetection.reason}`
        };
        webSearchDetection = {
          shouldUseWebSearch: false,
          reason: 'Deep thinking mode - no web search needed',
          confidence: 'high' as const
        };
      } else {
        // PRIORITY 2: Web search detection
        webSearchDetection = shouldUseWebSearch(lastMessage, browserSearchEnabled);
        
        if (webSearchDetection.shouldUseWebSearch && browserSearchEnabled) {
          // Web search needed → use 120B with web search tools
          modelSelection = {
            modelId: 'openai/gpt-oss-120b',
            displayName: 'GPT OSS 120B (Deep Analysis + Web Search)',
            reason: `Web search needed: ${webSearchDetection.reason}`
          };
        } else {
          // PRIORITY 3: CBT analysis or regular chat → smart selection
          modelSelection = selectModelForRequirements(lastMessage, webSearchDetection);
        }
      }
    }
    
    model = modelSelection.modelId;

    // Enhanced decision chain logging for debugging
    logger.info('Model selection decision chain', {
      ...requestContext,
      decisionChain: {
        phase1_contentAnalysis: {
          lastMessageLength: lastMessage.length,
          lastMessagePreview: lastMessage.substring(0, 100),
          stateless: true // No conversation context used
        },
        phase2_deepThinkingDetection: forceModel ? null : {
          shouldUseDeepThinking: deepThinkingDetection?.shouldUseDeepThinking || false,
          reason: deepThinkingDetection?.reason || 'Not evaluated (force model)',
          confidence: deepThinkingDetection?.confidence || 'N/A'
        },
        phase3_webSearchDetection: {
          shouldUseWebSearch: webSearchDetection.shouldUseWebSearch,
          reason: webSearchDetection.reason,
          confidence: webSearchDetection.confidence,
          browserSearchEnabled,
          userCanUseWebSearch: browserSearchEnabled
        },
        phase4_modelSelection: {
          selectedModel: model,
          displayName: modelSelection.displayName,
          selectionReason: modelSelection.reason,
          isForceModel: !!forceModel,
          willUse120B: model === 'openai/gpt-oss-120b',
          willUse20B: model === 'openai/gpt-oss-20b'
        },
        phase5_toolsDecision: {
          webSearchToolsWillBeAdded: webSearchDetection.shouldUseWebSearch && supportsWebSearch(model),
          modelSupportsWebSearch: supportsWebSearch(model),
          webSearchRequested: webSearchDetection.shouldUseWebSearch,
          finalDecision: webSearchDetection.shouldUseWebSearch && supportsWebSearch(model) ? 'ADD_WEB_SEARCH_TOOLS' : 'NO_TOOLS'
        }
      },
      settings: {
        temperature,
        maxTokens,
        topP,
        reasoningEffort,
        hasApiKey: !!apiKey
      }
    });

    if (!messages) {
      logger.validationError('/api/chat', 'Messages are required', requestContext);
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Use provided API key or fallback to environment variable
    const groqApiKey = apiKey || process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key is required. Please provide it in settings or set GROQ_API_KEY environment variable.' },
        { status: 400 }
      );
    }

    // Initialize Groq client with API key
    const groq = new Groq({ apiKey: groqApiKey });

    // Fetch memory context from previous sessions for therapeutic continuity
    let memoryContext: MemoryContext[] = [];
    if (sessionId) {
      try {
        logger.info('Fetching therapeutic memory context', {
          ...requestContext,
          sessionId,
          memoryEndpoint: `/api/reports/memory?excludeSessionId=${sessionId}&limit=3`
        });
        
        const memoryResponse = await fetch(`${request.nextUrl.origin}/api/reports/memory?excludeSessionId=${sessionId}&limit=3`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (memoryResponse.ok) {
          const memoryData = await memoryResponse.json();
          if (memoryData.success && memoryData.memoryContext) {
            memoryContext = memoryData.memoryContext;
            
            // Enhanced logging with memory statistics
            const memoryStats = {
              totalReportsFound: memoryData.stats?.totalReportsFound || 0,
              successfullyDecrypted: memoryData.stats?.successfullyDecrypted || memoryContext.length,
              failedDecryptions: memoryData.stats?.failedDecryptions || 0,
              memoryContextCount: memoryContext.length,
              totalMemoryLength: memoryContext.reduce((acc, m) => acc + m.content.length, 0),
              totalSummaryLength: memoryContext.reduce((acc, m) => acc + m.summary.length, 0),
              sessionTitles: memoryContext.map(m => m.sessionTitle),
              sessionDates: memoryContext.map(m => m.sessionDate)
            };
            
            logger.info('Therapeutic memory context loaded successfully', {
              ...requestContext,
              sessionId,
              ...memoryStats
            });
            
            // Log individual memory entries for debugging
            memoryContext.forEach((memory, index) => {
              logger.info(`Memory context ${index + 1}`, {
                ...requestContext,
                sessionId,
                memorySessionTitle: memory.sessionTitle,
                memorySessionDate: memory.sessionDate,
                memoryReportDate: memory.reportDate,
                summaryLength: memory.summary.length,
                contentLength: memory.content.length
              });
            });
            
          } else {
            logger.warn('Memory response successful but no memory context found', {
              ...requestContext,
              sessionId,
              responseData: {
                success: memoryData.success,
                hasMemoryContext: !!memoryData.memoryContext,
                memoryContextLength: memoryData.memoryContext?.length || 0
              }
            });
          }
        } else {
          const errorText = await memoryResponse.text();
          logger.error('Memory endpoint returned error response', {
            ...requestContext,
            sessionId,
            memoryResponseStatus: memoryResponse.status,
            memoryResponseError: errorText.substring(0, 200)
          });
        }
      } catch (memoryError) {
        logger.error('Failed to fetch memory context, proceeding without it', {
          ...requestContext,
          error: memoryError instanceof Error ? memoryError.message : 'Unknown error',
          errorStack: memoryError instanceof Error ? memoryError.stack : undefined,
          sessionId
        });
      }
    } else {
      logger.info('No sessionId provided, skipping memory context loading', {
        ...requestContext
      });
    }

    // Build memory-enhanced system prompt
    const systemPrompt = buildMemoryEnhancedPrompt(memoryContext);

    // Get AI response from Groq
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completionParams: any = {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      model: model,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true
    };

    // Add reasoning effort if supported by the model
    if (reasoningEffort && ['low', 'medium', 'high'].includes(reasoningEffort)) {
      completionParams.reasoning_effort = reasoningEffort;
      logger.info('Reasoning effort enabled', {
        ...requestContext,
        model,
        reasoningEffort
      });
    }

    // PHASE 3: Add web search tools based on requirements detection
    if (webSearchDetection.shouldUseWebSearch && supportsWebSearch(model)) {
      completionParams.tools = [{"type": "browser_search"}];
      logger.info('Web search tools added - requirements satisfied', {
        ...requestContext,
        model,
        modelDisplayName: modelSelection.displayName,
        webSearchDetection: {
          shouldUseWebSearch: webSearchDetection.shouldUseWebSearch,
          reason: webSearchDetection.reason,
          confidence: webSearchDetection.confidence
        },
        toolsAdded: ['browser_search']
      });
    } else if (webSearchDetection.shouldUseWebSearch && !supportsWebSearch(model)) {
      // This should theoretically never happen with the new logic since we select 120B when web search is needed
      logger.warn('Web search needed but model does not support it - this indicates a logic error', {
        ...requestContext,
        model,
        modelDisplayName: modelSelection.displayName,
        webSearchDetection: {
          shouldUseWebSearch: webSearchDetection.shouldUseWebSearch,
          reason: webSearchDetection.reason,
          confidence: webSearchDetection.confidence
        },
        issue: 'model_selection_logic_error'
      });
    } else {
      logger.info('No web search tools needed', {
        ...requestContext,
        model,
        webSearchDetection: {
          shouldUseWebSearch: webSearchDetection.shouldUseWebSearch,
          reason: webSearchDetection.reason
        }
      });
    }

    // Create completion with enhanced error handling
    let completion;
    try {
      logger.info('Creating Groq completion with parameters', {
        ...requestContext,
        paramsKeys: Object.keys(completionParams),
        hasTools: !!completionParams.tools,
        hasReasoningEffort: !!completionParams.reasoning_effort
      });
      
      completion = await groq.chat.completions.create(completionParams);
    } catch (apiError) {
      logger.error('Groq API error during completion creation', {
        ...requestContext,
        error: apiError instanceof Error ? apiError.message : 'Unknown error',
        model,
        browserSearchEnabled,
        reasoningEffort,
        paramsKeys: Object.keys(completionParams)
      });
      
      // If tools caused the error, try without tools
      if (browserSearchEnabled && completionParams.tools) {
        logger.warn('Retrying without browser search tools due to API error', requestContext);
        delete completionParams.tools;
        
        try {
          completion = await groq.chat.completions.create(completionParams);
          logger.info('Successfully created completion without tools', requestContext);
        } catch (retryError) {
          logger.error('Failed even without tools', {
            ...requestContext,
            retryError: retryError instanceof Error ? retryError.message : 'Unknown error'
          });
          throw retryError;
        }
      } else {
        throw apiError;
      }
    }

    // Convert Groq stream to Response stream with model metadata
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        try {
          // Collect the complete response first
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for await (const chunk of completion as any) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
            }
          }
          
          // Filter out <think></think> tags from the complete response
          const filteredResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          
          // Send model metadata as the first chunk (critical for model capture)
          const modelMetadata = `data: ${JSON.stringify({
            choices: [{ delta: { content: '' } }],
            model: model,
            model_info: {
              name: model,
              timestamp: new Date().toISOString(),
              reliable: true,
              is_metadata_chunk: true
            }
          })}\n\n`;
          controller.enqueue(encoder.encode(modelMetadata));
          
          // Send the filtered response in chunks to simulate streaming
          const chunkSize = 50; // Adjust for desired streaming speed
          for (let i = 0; i < filteredResponse.length; i += chunkSize) {
            const chunk = filteredResponse.slice(i, i + chunkSize);
            const response = `data: ${JSON.stringify({
              choices: [{ delta: { content: chunk } }],
              model: model, // Ensure every chunk has model info
              chunk_index: Math.floor(i / chunkSize),
              has_content: chunk.length > 0
            })}\n\n`;
            controller.enqueue(encoder.encode(response));
            
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return handleAIError(error, {
      requestId: requestContext.requestId,
      operation: 'ai_chat_completion',
      additionalContext: {
        model: model || 'unknown',
        browserSearchEnabled: false,
        reasoningEffort: 'unknown',
        messageCount: 0
      }
    });
  }
}