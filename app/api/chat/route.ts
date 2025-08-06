import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { buildMemoryEnhancedPrompt, type MemoryContext } from '@/lib/therapy-prompts';
import { chatRequestSchema, validateRequest } from '@/lib/validation';
import { logger, createRequestLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  let model = 'openai/gpt-oss-120b'; // Default model value accessible in catch block
  
  try {
    logger.info('Chat request received', requestContext);
    
    const requestData = await request.json();
    const { 
      messages, 
      apiKey, 
      temperature = 0.6,
      maxTokens = 32000,
      topP = 0.95,
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
    const completion = await groq.chat.completions.create({
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
    });

    // Convert Groq stream to Response stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        try {
          // Collect the complete response first
          for await (const chunk of completion) {
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
    // Handle specific Groq API errors
    if (error instanceof Error && error.message.includes('model_not_found')) {
      logger.warn('Model not found error', {
        ...requestContext,
        model,
        errorMessage: error.message
      });
      
      return NextResponse.json(
        { 
          error: 'Model not available',
          details: `The model "${model}" is not available. Please select a different model from the settings.`,
          suggestedAction: 'Change model in settings'
        },
        { status: 400 }
      );
    }
    
    // Handle other API errors
    if (error instanceof Error && error.message.includes('404')) {
      logger.warn('API resource not found', {
        ...requestContext,
        model,
        errorMessage: error.message
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'The requested resource was not found. Please check your model selection.',
          suggestedAction: 'Verify model name in settings'
        },
        { status: 400 }
      );
    }

    logger.apiError('/api/chat', error as Error, requestContext);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}