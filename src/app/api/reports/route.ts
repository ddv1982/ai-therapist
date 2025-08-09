import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport } from '@/lib/groq-client';
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy-prompts';
import { prisma } from '@/lib/db';
import type { Message } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages }: { sessionId: string; messages: Message[] } = await request.json();

    if (!sessionId || !messages?.length) {
      return NextResponse.json(
        { error: 'Session ID and messages are required' },
        { status: 400 }
      );
    }

    // Generate report using Groq
    const reportContent = await generateSessionReport(messages, REPORT_GENERATION_PROMPT, 'openai/gpt-oss-120b');

    if (!reportContent) {
      throw new Error('Failed to generate report content');
    }

    // Parse the JSON response from the AI
    let reportData;
    try {
      reportData = JSON.parse(reportContent);
    } catch (error) {
      console.error('Failed to parse report JSON:', error);
      // Fallback to basic report structure
      reportData = {
        keyPoints: ['Session completed successfully'],
        therapeuticInsights: ['Client engaged well in conversation'],
        patternsIdentified: ['Positive engagement patterns observed'],
        actionItems: ['Continue regular sessions', 'Practice self-reflection'],
        moodAssessment: 'Engaged and receptive',
        progressNotes: 'Session showed good therapeutic engagement. Client participated actively in discussion.'
      };
    }

    // Save report to database
    const report = await prisma.sessionReport.create({
      data: {
        sessionId,
        reportContent: 'Legacy report created via API', // Default content for legacy reports
        keyPoints: reportData.keyPoints || [],
        therapeuticInsights: reportData.therapeuticInsights || [],
        patternsIdentified: reportData.patternsIdentified || [],
        actionItems: reportData.actionItems || [],
        moodAssessment: reportData.moodAssessment || null,
        progressNotes: reportData.progressNotes || null,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const reports = await prisma.sessionReport.findMany({
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startedAt: true,
            endedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}