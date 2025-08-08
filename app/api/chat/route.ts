import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { buildMemoryEnhancedPrompt, type MemoryContext } from '@/lib/therapy-prompts';
import { logger, createRequestLogger } from '@/lib/logger';
import { validateApiAuth, createAuthErrorResponse } from '@/lib/api-auth';
import { handleAIError } from '@/lib/error-utils';

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  let model = 'openai/gpt-oss-120b'; // Default model value accessible in catch block
  
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
    
    // Override default model if provided
    model = requestData.model || model;

    // Log the actual settings being used
    logger.info('Using chat settings', {
      ...requestContext,
      model,
      temperature,
      maxTokens,
      topP,
      browserSearchEnabled,
      reasoningEffort,
      hasApiKey: !!apiKey
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
            
            logger.info('Memory context loaded for therapeutic continuity', {
              ...requestContext,
              sessionId,
              memoryContextCount: memoryContext.length,
              totalMemoryLength: memoryContext.reduce((acc, m) => acc + m.content.length, 0)
            });
          }
        }
      } catch (memoryError) {
        logger.warn('Failed to fetch memory context, proceeding without it', {
          ...requestContext,
          error: memoryError instanceof Error ? memoryError.message : 'Unknown error',
          sessionId
        });
      }
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

    // Add browser search tools if enabled (only for compatible models)
    if (browserSearchEnabled) {
      // List of models known to support browser search tools
      const toolsSupportedModels = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'llama3-groq-70b-8192-tool-use-preview'
      ];
      
      const supportsTools = toolsSupportedModels.some(supportedModel => 
        model.includes(supportedModel.split('/').pop() || supportedModel)
      );
      
      if (supportsTools) {
        completionParams.tools = [{"type": "browser_search"}];
        logger.info('Browser search enabled for compatible model', {
          ...requestContext,
          model,
          supportsTools
        });
      } else {
        logger.warn('Browser search requested but model does not support tools', {
          ...requestContext,
          model,
          browserSearchEnabled,
          supportedModels: toolsSupportedModels
        });
        // Add a note to the system prompt instead
        completionParams.messages[0].content += '\n\nNote: The user requested web search capabilities, but this model does not support live web browsing. Please let the user know if you need current information that might require web search.';
      }
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

    // Convert Groq stream to Response stream
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
          
          // Send the filtered response in chunks to simulate streaming
          const chunkSize = 50; // Adjust for desired streaming speed
          for (let i = 0; i < filteredResponse.length; i += chunkSize) {
            const chunk = filteredResponse.slice(i, i + chunkSize);
            const response = `data: ${JSON.stringify({
              choices: [{ delta: { content: chunk } }]
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

    return new NextResponse(stream, {
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
        model,
        browserSearchEnabled,
        reasoningEffort,
        messageCount: messages.length
      }
    });
  }
}