import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGroqApiKey: !!process.env.GROQ_API_KEY
  });
}