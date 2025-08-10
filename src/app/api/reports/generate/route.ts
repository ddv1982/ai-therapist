import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport, extractStructuredAnalysis, type ReportMessage } from '@/lib/groq-client';
import { REPORT_GENERATION_PROMPT, ANALYSIS_EXTRACTION_PROMPT } from '@/lib/therapy-prompts';
import { prisma } from '@/lib/db';
import { logger, createRequestLogger } from '@/lib/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/validation';
import { encryptSessionReportContent, encryptEnhancedAnalysisData } from '@/lib/message-encryption';
import { validateTherapeuticContext, calculateContextualConfidence } from '@/lib/therapy/context-validator';
import type { Prisma } from '@prisma/client';


interface CognitiveDistortion {
  name?: string;
  contextAwareConfidence?: number;
  falsePositiveRisk?: 'low' | 'medium' | 'high';
}

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
  
  // Enhanced fields for user data priority
  userDataIntegration?: {
    userRatingsUsed?: boolean;
    userAssessmentCount?: number;
    userInsightsPrioritized?: boolean;
  };
  contentTierMetadata?: {
    tier?: string;
    analysisScope?: string;
    userDataReliability?: number;
  };
}

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    // Always use analytical model for detailed session reports
    const reportModel = 'openai/gpt-oss-120b';
    
    logger.info('Report generation request received', {
      ...requestContext,
      modelUsed: reportModel,
      modelDisplayName: 'GPT OSS 120B (Deep Analysis)',
      selectionReason: 'Report generation requires analytical model',
      reportGenerationFlow: true
    });
    
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

    // Generate the human-readable session report using AI
    logger.info('Generating session report with AI model', {
      ...requestContext,
      modelUsed: reportModel,
      messageCount: messages.length,
      reportGenerationStep: 'ai_generation'
    });
    
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
        
        // Apply contextual validation to cognitive distortions
        if (parsedAnalysis.cognitiveDistortions && Array.isArray(parsedAnalysis.cognitiveDistortions)) {
          console.log('Applying contextual validation to cognitive distortions...');
          
          // Get combined message content for context analysis
          const fullConversationContent = messages.map(m => m.content).join(' ');
          const contextValidation = validateTherapeuticContext(fullConversationContent);
          
          // Filter and enhance distortions based on context validation
          parsedAnalysis.cognitiveDistortions = parsedAnalysis.cognitiveDistortions
            .map((distortion: CognitiveDistortion) => {
              // Apply contextual confidence adjustment
              if (typeof distortion.contextAwareConfidence === 'number') {
                const enhancedConfidence = calculateContextualConfidence(
                  distortion.contextAwareConfidence,
                  contextValidation,
                  false // TODO: Add CBT alignment check
                );
                distortion.contextAwareConfidence = enhancedConfidence;
              }
              return distortion;
            })
            .filter((distortion: CognitiveDistortion) => {
              // Filter out high false positive risk distortions
              if (distortion.falsePositiveRisk === 'high' && 
                  distortion.contextAwareConfidence < 60) {
                console.log(`Filtered out potential false positive: ${distortion.name}`);
                return false;
              }
              return true;
            });
          
          logger.info('Contextual validation applied to cognitive distortions', {
            originalCount: parsedAnalysis.cognitiveDistortions?.length || 0,
            contextType: contextValidation.contextualAnalysis.contextType,
            emotionalIntensity: contextValidation.contextualAnalysis.emotionalIntensity,
            therapeuticRelevance: contextValidation.contextualAnalysis.therapeuticRelevance
          });
        }
        
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

    logger.info('Session report generated successfully', {
      ...requestContext,
      modelUsed: reportModel,
      reportLength: completion.length,
      reportGenerationStep: 'completed_successfully'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report generated successfully',
      reportContent: completion,
      modelUsed: reportModel, // Include model info in response
      modelDisplayName: 'GPT OSS 120B (Deep Analysis)'
    });

  } catch (error) {
    console.error('Error in report generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}