import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy-prompts';
import { chatRequestSchema, validateRequest } from '@/lib/validation';
import { detectCrisis, CRISIS_RESPONSES } from '@/lib/crisis-detection';
import { logger, createRequestLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.info('Chat request received', requestContext);
    
    const { 
      messages, 
      apiKey, 
      model = 'qwen/qwen3-32b', 
      temperature = 0.6,
      maxTokens = 40960,
      topP = 0.95
    } = await request.json();

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

    // Enhanced crisis detection with context awareness
    const latestMessage = messages[messages.length - 1];
    const conversationHistory = messages.slice(-5).map(m => m.content); // Last 5 messages for context
    const crisisDetection = detectCrisis(latestMessage.content, conversationHistory);

    if (crisisDetection.isCrisis) {
      // Log crisis detection for monitoring
      logger.crisisDetected(crisisDetection.severity, crisisDetection.confidence, {
        ...requestContext,
        keywords: crisisDetection.keywords,
        suggestions: crisisDetection.suggestions
      });
      
      // Return appropriate crisis response based on severity
      const crisisResponse = CRISIS_RESPONSES[crisisDetection.severity];
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const response = `data: ${JSON.stringify({
            choices: [{ delta: { content: crisisResponse } }],
            crisis_detection: {
              severity: crisisDetection.severity,
              confidence: crisisDetection.confidence,
              suggestions: crisisDetection.suggestions
            },
            settings_used: { model, temperature, maxTokens, topP }
          })}\n\n`;
          controller.enqueue(encoder.encode(response));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Get AI response from Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: THERAPY_SYSTEM_PROMPT
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
    logger.apiError('/api/chat', error as Error, requestContext);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}