import { NextResponse } from 'next/server';

// Simple endpoint that returns hardcoded model information
// Since we use fixed models now, no need to query Groq API
export async function GET() {
  try {
    const availableModels = [
      { 
        id: 'openai/gpt-oss-20b', 
        name: 'GPT OSS 20B (Fast)', 
        provider: 'OpenAI', 
        maxTokens: 30000, 
        category: 'production',
        description: 'Fast model for regular conversations'
      },
      { 
        id: 'openai/gpt-oss-120b', 
        name: 'GPT OSS 120B (Deep Analysis)', 
        provider: 'OpenAI', 
        maxTokens: 30000, 
        category: 'featured',
        description: 'Advanced model for CBT analysis and session reports'
      }
    ];

    return NextResponse.json({
      models: availableModels,
      total: availableModels.length,
      note: 'Models are now automatically selected based on content type'
    });
  } catch (error) {
    console.error('Failed to return model info:', error);
    return NextResponse.json(
      { error: 'Failed to get model information' },
      { status: 500 }
    );
  }
}