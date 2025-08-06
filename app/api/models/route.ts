import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

interface GroqModel {
  id: string;
  owned_by?: string;
  active: boolean;
  context_window?: number;
  created?: number;
  object?: string;
}

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
    
    // Custom token limits: 32000 default, keep lower values, Kimi to 16000
    const getCustomMaxTokens = (modelId: string, apiMaxTokens: number): number => {
      // Special case for Kimi models
      if (modelId.includes('kimi')) {
        return 16000;
      }
      
      // If API reports a value lower than 32000, keep the lower value
      if (apiMaxTokens && apiMaxTokens < 32000) {
        return apiMaxTokens;
      }
      
      // Otherwise set to 32000
      return 32000;
    };

    // Filter and format models for the UI  
    const availableModels = models.data
      .filter((model) => (model as GroqModel).active)
      .map((model) => {
        const groqModel = model as GroqModel;
        const apiMaxTokens = groqModel.context_window || 4096;
        return {
          id: groqModel.id,
          name: groqModel.id,
          provider: groqModel.owned_by || 'groq',
          maxTokens: getCustomMaxTokens(groqModel.id, apiMaxTokens),
          active: groqModel.active
        };
      })
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