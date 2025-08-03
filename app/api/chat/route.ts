import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { THERAPY_SYSTEM_PROMPT, CRISIS_INTERVENTION_KEYWORDS, CRISIS_RESPONSE } from '@/lib/therapy-prompts';

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      apiKey, 
      model = 'qwen/qwen3-32b', 
      temperature = 0.6,
      maxTokens = 40960,
      topP = 0.95
    } = await request.json();

    if (!messages) {
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

    // Check for crisis keywords in the latest user message
    const latestMessage = messages[messages.length - 1];
    const containsCrisisKeywords = CRISIS_INTERVENTION_KEYWORDS.some(keyword =>
      latestMessage.content.toLowerCase().includes(keyword)
    );

    if (containsCrisisKeywords) {
      // Return crisis response immediately
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const response = `data: ${JSON.stringify({
            choices: [{ delta: { content: CRISIS_RESPONSE } }]
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
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}