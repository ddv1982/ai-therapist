import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport, type ReportMessage } from '@/lib/groq-client';
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy-prompts';
import { prisma } from '@/lib/db';
import { logger, createRequestLogger } from '@/lib/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/validation';
import { encryptSessionReportContent } from '@/lib/message-encryption';


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

    // Save the report to database for therapeutic memory with encryption
    try {
      // Encrypt sensitive report content before storage
      const encryptedReportContent = encryptSessionReportContent(completion);
      
      await prisma.sessionReport.create({
        data: {
          sessionId,
          reportContent: encryptedReportContent, // Encrypted sensitive content
          keyPoints: [], // PostgreSQL native JSON array
          therapeuticInsights: {}, // PostgreSQL native JSON object - could contain structured insights
          patternsIdentified: [], // PostgreSQL native JSON array
          actionItems: [], // PostgreSQL native JSON array
          moodAssessment: '',
          progressNotes: `Report generated on ${new Date().toISOString()}`,
        }
      });
      
      logger.info('Session report saved to database for therapeutic memory', {
        ...requestContext,
        sessionId,
        reportLength: completion.length
      });
    } catch (dbError) {
      logger.error('Failed to save report to database', {
        ...requestContext,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        sessionId
      });
      // Continue anyway - report generation is more important than storage
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