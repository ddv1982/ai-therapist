import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export async function GET() {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const models = await groq.models.list();
    
    // Filter and format models for the UI
    const availableModels = models.data
      .filter(model => model.active)
      .map(model => ({
        id: model.id,
        name: model.id,
        provider: model.owned_by || 'groq',
        maxTokens: model.context_window || 4096,
        active: model.active
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      models: availableModels,
      total: availableModels.length
    });
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    );
  }
}