import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport, type ReportMessage } from '@/lib/groq-client';
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy-prompts';
import { prisma } from '@/lib/db';
import { logger, createRequestLogger } from '@/lib/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/validation';
import type { ReportGenerationInput } from '@/lib/validation';


export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.info('Report generation request received', requestContext);
    
    const body = await request.json();
    
    // Validate request body using proper schema
    const validation = validateRequest(reportGenerationSchema, body);
    if (!validation.success) {
      logger.validationError('/api/reports/generate', validation.error, requestContext);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const { sessionId, messages, model } = validation.data;

    // Generate the session report using AI
    console.log(`Generating session report using model: ${model}...`);
    const completion = await generateSessionReport(messages as ReportMessage[], REPORT_GENERATION_PROMPT, model);
    
    if (!completion) {
      return NextResponse.json(
        { error: 'Failed to generate session report' },
        { status: 500 }
      );
    }

    // Optionally save the report to database
    try {
      await prisma.sessionReport.create({
        data: {
          sessionId,
          keyPoints: JSON.stringify([]),
          therapeuticInsights: completion,
          patternsIdentified: JSON.stringify([]),
          actionItems: JSON.stringify([]),
          moodAssessment: '',
          progressNotes: `Report generated on ${new Date().toISOString()}`,
        }
      });
    } catch (dbError) {
      console.warn('Failed to save report to database:', dbError);
      // Continue anyway - report generation is more important
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report generated successfully',
      reportContent: completion
    });

  } catch (error) {
    console.error('Error in report generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}