import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport, extractStructuredAnalysis, type ReportMessage } from '@/lib/groq-client';
import { REPORT_GENERATION_PROMPT, ANALYSIS_EXTRACTION_PROMPT } from '@/lib/therapy-prompts';
import { prisma } from '@/lib/db';
import { logger, createRequestLogger } from '@/lib/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/validation';
import { encryptSessionReportContent, encryptEnhancedAnalysisData } from '@/lib/message-encryption';
import type { Prisma } from '@prisma/client';


interface ParsedAnalysis {
  sessionOverview?: {
    themes?: string[];
    emotionalTone?: string;
    engagement?: string;
  };
  cognitiveDistortions?: unknown[];
  schemaAnalysis?: {
    activeModes?: unknown[];
    triggeredSchemas?: unknown[];
    behavioralPatterns?: string[];
    predominantMode?: string | null;
    copingStrategies?: { adaptive: string[]; maladaptive: string[] };
    therapeuticRecommendations?: string[];
  };
  therapeuticFrameworks?: unknown[];
  recommendations?: unknown[];
  keyPoints?: Prisma.InputJsonValue;
  therapeuticInsights?: Prisma.InputJsonValue;
  patternsIdentified?: Prisma.InputJsonValue;
  actionItems?: Prisma.InputJsonValue;
  moodAssessment?: string;
  progressNotes?: string;
  analysisConfidence?: number;
}

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

    const { sessionId, messages } = validation.data;
    
    // Always use gpt-oss-120b for detailed session reports
    const reportModel = 'openai/gpt-oss-120b';

    // Generate the human-readable session report using AI
    console.log(`Generating session report using model: ${reportModel}...`);
    const completion = await generateSessionReport(messages as ReportMessage[], REPORT_GENERATION_PROMPT, reportModel);
    
    if (!completion) {
      return NextResponse.json(
        { error: 'Failed to generate session report' },
        { status: 500 }
      );
    }

    // Extract structured analysis data from the report
    console.log('Extracting structured analysis data...');
    const analysisData = await extractStructuredAnalysis(completion, ANALYSIS_EXTRACTION_PROMPT, reportModel);
    
    let parsedAnalysis: ParsedAnalysis = {};
    if (analysisData) {
      try {
        // Clean up the JSON string before parsing (remove markdown code blocks if present)
        let cleanedAnalysisData = analysisData.trim();
        if (cleanedAnalysisData.startsWith('```json')) {
          cleanedAnalysisData = cleanedAnalysisData.replace(/```json\s*|\s*```/g, '');
        }
        if (cleanedAnalysisData.startsWith('```')) {
          cleanedAnalysisData = cleanedAnalysisData.replace(/```\s*|\s*```/g, '');
        }
        
        parsedAnalysis = JSON.parse(cleanedAnalysisData) as ParsedAnalysis;
        console.log('Successfully parsed structured analysis data');
      } catch (error) {
        console.warn('Failed to parse structured analysis, using defaults:', error);
        console.warn('Raw analysis data:', analysisData?.substring(0, 500));
        // Continue with empty analysis - the human-readable report is still valuable
      }
    }

    // Save the report to database for therapeutic memory with encryption
    try {

      // Encrypt sensitive report content before storage
      const encryptedReportContent = encryptSessionReportContent(completion);
      
      // Prepare enhanced analysis data for encryption
      const enhancedAnalysisData = {
        cognitiveDistortions: parsedAnalysis.cognitiveDistortions || [],
        schemaAnalysis: parsedAnalysis.schemaAnalysis || {
          activeModes: [],
          triggeredSchemas: [],
          predominantMode: null,
          behavioralPatterns: [],
          copingStrategies: { adaptive: [], maladaptive: [] },
          therapeuticRecommendations: []
        },
        therapeuticFrameworks: parsedAnalysis.therapeuticFrameworks || [],
        recommendations: parsedAnalysis.recommendations || []
      };

      // Encrypt the enhanced psychological analysis data
      const encryptedAnalysisData = encryptEnhancedAnalysisData(enhancedAnalysisData);
      
      // Create enhanced analysis data
      const reportData = {
        sessionId,
        reportContent: encryptedReportContent, // Encrypted full report content
        keyPoints: parsedAnalysis.keyPoints || [],
        therapeuticInsights: parsedAnalysis.therapeuticInsights || {},
        patternsIdentified: parsedAnalysis.patternsIdentified || [],
        actionItems: parsedAnalysis.actionItems || [],
        moodAssessment: parsedAnalysis.moodAssessment || '',
        progressNotes: parsedAnalysis.progressNotes || `Report generated on ${new Date().toISOString()}`,
        
        // Enhanced psychological analysis fields (encrypted) - safely handle all fields
        ...(encryptedAnalysisData.cognitiveDistortions ? { 
          cognitiveDistortions: encryptedAnalysisData.cognitiveDistortions 
        } : {}),
        ...(encryptedAnalysisData.schemaAnalysis ? { 
          schemaAnalysis: encryptedAnalysisData.schemaAnalysis 
        } : {}),
        ...(encryptedAnalysisData.therapeuticFrameworks ? { 
          therapeuticFrameworks: encryptedAnalysisData.therapeuticFrameworks 
        } : {}),
        ...(encryptedAnalysisData.recommendations ? { 
          recommendations: encryptedAnalysisData.recommendations 
        } : {}),
        analysisConfidence: parsedAnalysis.analysisConfidence || 75,
        analysisVersion: "enhanced_v1.0" // Track version for future updates
      };

      await prisma.sessionReport.create({
        data: reportData
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