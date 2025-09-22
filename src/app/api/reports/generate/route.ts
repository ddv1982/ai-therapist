import { NextRequest } from 'next/server';
import { generateSessionReport, extractStructuredAnalysis, type ReportMessage } from '@/lib/api/groq-client';
import { REPORT_GENERATION_PROMPT, ANALYSIS_EXTRACTION_PROMPT } from '@/lib/therapy/therapy-prompts';
import { prisma } from '@/lib/database/db';
import { logger, devLog } from '@/lib/utils/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/utils/validation';
import { encryptSessionReportContent, encryptEnhancedAnalysisData } from '@/lib/chat/message-encryption';
import { validateTherapeuticContext, calculateContextualConfidence } from '@/lib/therapy/context-validator';
import { parseAllCBTData, hasCBTData, generateCBTSummary } from '@/lib/therapy/cbt-data-parser';
import { deduplicateRequest } from '@/lib/utils/request-deduplication';
import type { Prisma } from '@prisma/client';
import { generateFallbackAnalysis as generateFallbackAnalysisExternal } from '@/lib/reports/fallback-analysis';
import { withApiMiddleware } from '@/lib/api/api-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';

// Note: CognitiveDistortion interface removed - using types from report.ts instead

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
    dataSource?: string;
  };
}

/**
 * Generates fallback analysis when JSON parsing fails by extracting insights from the human-readable report
 */
function generateFallbackAnalysis(reportContent: string): ParsedAnalysis {
  return generateFallbackAnalysisExternal(reportContent) as unknown as ParsedAnalysis;
}

export const POST = withApiMiddleware(async (request: NextRequest, context) => {
  try {
    // Always use analytical model for detailed session reports
    const { REPORT_MODEL_ID } = await import('@/features/chat/config');
    const reportModel = REPORT_MODEL_ID;
    
    logger.info('Report generation request received', {
      ...context,
      modelUsed: reportModel,
      modelDisplayName: 'GPT OSS 120B (Deep Analysis)',
      selectionReason: 'Report generation requires analytical model',
      reportGenerationFlow: true
    });
    
    const body = await request.json();
    
    // Validate request body using proper schema
    const validation = validateRequest(reportGenerationSchema, body);
    if (!validation.success) {
      logger.validationError('/api/reports/generate', validation.error, context);
      return createErrorResponse('Validation failed', 400, {
        code: 'VALIDATION_ERROR',
        details: validation.error,
        requestId: context.requestId,
      });
    }

    const { sessionId, messages } = validation.data;

    // Deduplicate report generation to prevent multiple concurrent generations for same session
    return await deduplicateRequest(
      sessionId, // Use sessionId as userId since this endpoint doesn't have auth
      'generate_report',
      async () => {
        // Check for CBT data in chat messages
        devLog('Checking messages for CBT content...');
        let cbtData = null;
        let cbtSummary = '';
        let dataSource = 'none';
    
    const hasCBTContent = hasCBTData(messages);
    
    if (hasCBTContent) {
      devLog('CBT data detected in messages, parsing structured information...');
      cbtData = parseAllCBTData(messages);
      cbtSummary = generateCBTSummary(cbtData);
      dataSource = 'parsed';
      
      logger.info('CBT data extracted from messages', {
        ...context,
        hasSituation: !!cbtData.situation,
        hasEmotions: !!cbtData.emotions,
        hasThoughts: !!cbtData.thoughts,
        hasCoreBeliefs: !!cbtData.coreBeliefs,
        hasActionPlan: !!cbtData.actionPlan,
        cbtSummaryLength: cbtSummary.length,
        dataSource: 'message-parsing'
      });
    }

    // Generate the human-readable session report using AI
    logger.info('Generating session report with AI model', {
      ...context,
      modelUsed: reportModel,
      messageCount: messages.length,
      reportGenerationStep: 'ai_generation'
    });

    // Locale-aware report prompt
    const { getApiRequestLocale } = await import('@/i18n/request');
    const locale = getApiRequestLocale(request);
    const languageDirective =
      locale === 'nl'
        ? `LANGUAGE REQUIREMENT:
Write the entire therapeutic report in Dutch (Nederlands) with natural phrasing. Keep any code blocks, special markers, and JSON keys exactly as-is.`
        : `LANGUAGE REQUIREMENT:
Write the entire therapeutic report in English. Keep any code blocks, special markers, and JSON keys exactly as-is.`;
    const reportPrompt = `${REPORT_GENERATION_PROMPT}

${languageDirective}`;

    const completion = await generateSessionReport(messages as ReportMessage[], reportPrompt, reportModel);
    
    if (!completion) {
      return createErrorResponse('Failed to generate session report', 500, { requestId: context.requestId });
    }

    // Extract structured analysis data from the report
    devLog('Extracting structured analysis data...');
    const analysisData = await extractStructuredAnalysis(completion, ANALYSIS_EXTRACTION_PROMPT, reportModel);
    
    let parsedAnalysis: ParsedAnalysis = {};
    let cleanedAnalysisData = '';
    if (analysisData) {
      try {
        // Enhanced JSON cleaning with multiple fallback strategies
        cleanedAnalysisData = analysisData.trim();
        
        // Remove markdown code blocks
        cleanedAnalysisData = cleanedAnalysisData.replace(/```json\s*/g, '');
        cleanedAnalysisData = cleanedAnalysisData.replace(/```\s*/g, '');
        cleanedAnalysisData = cleanedAnalysisData.replace(/\s*```$/g, '');
        
        // Remove common AI response prefixes/suffixes
        cleanedAnalysisData = cleanedAnalysisData.replace(/^Here's the structured analysis.*?:\s*/i, '');
        cleanedAnalysisData = cleanedAnalysisData.replace(/^Based on.*?:\s*/i, '');
        cleanedAnalysisData = cleanedAnalysisData.replace(/^The structured.*?:\s*/i, '');
        
        // Find JSON object boundaries
        const jsonStart = cleanedAnalysisData.indexOf('{');
        const jsonEnd = cleanedAnalysisData.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedAnalysisData = cleanedAnalysisData.substring(jsonStart, jsonEnd + 1);
        }
        
        // Remove trailing commas before closing brackets/braces
        cleanedAnalysisData = cleanedAnalysisData.replace(/,(\s*[}\]])/g, '$1');
        
        devLog(`Attempting to parse cleaned JSON data (${cleanedAnalysisData.length} chars)`);
        parsedAnalysis = JSON.parse(cleanedAnalysisData) as ParsedAnalysis;
        devLog('Successfully parsed structured analysis data');
        
        // Apply contextual validation to cognitive distortions
        if (parsedAnalysis.cognitiveDistortions && Array.isArray(parsedAnalysis.cognitiveDistortions)) {
          devLog('Applying contextual validation to cognitive distortions...');
          
          // Get combined message content for context analysis
          const fullConversationContent = messages.map(m => m.content).join(' ');
          const contextValidation = validateTherapeuticContext(fullConversationContent);
          
          // Filter and enhance distortions based on context validation
          if (parsedAnalysis.cognitiveDistortions) {
            parsedAnalysis.cognitiveDistortions = (parsedAnalysis.cognitiveDistortions as Array<{ contextAwareConfidence?: number; falsePositiveRisk?: string; name?: string }>)
              .map((distortion) => {
              // Apply contextual confidence adjustment
              if (typeof distortion.contextAwareConfidence === 'number') {
                const enhancedConfidence = calculateContextualConfidence(
                  distortion.contextAwareConfidence,
                  contextValidation,
                  Boolean(hasCBTContent)
                );
                distortion.contextAwareConfidence = enhancedConfidence;
              }
              return distortion;
            })
              .filter((distortion) => {
              // Filter out high false positive risk distortions
              if (distortion.falsePositiveRisk === 'high' && 
                  distortion.contextAwareConfidence && distortion.contextAwareConfidence < 60) {
                devLog(`Filtered out potential false positive: ${distortion.name}`);
                return false;
              }
              return true;
            });
          }
          
          logger.info('Contextual validation applied to cognitive distortions', {
            originalCount: parsedAnalysis.cognitiveDistortions?.length || 0,
            contextType: contextValidation.contextualAnalysis.contextType,
            emotionalIntensity: contextValidation.contextualAnalysis.emotionalIntensity,
            therapeuticRelevance: contextValidation.contextualAnalysis.therapeuticRelevance
          });
        }
        
      } catch (error) {
        // Enhanced error logging with detailed debugging information
        logger.error('JSON parsing failed for structured analysis', {
          ...context,
          error: error instanceof Error ? error.message : 'Unknown error',
          rawDataLength: analysisData?.length || 0,
          rawDataSample: analysisData?.substring(0, 200) || 'No data',
          cleanedDataSample: cleanedAnalysisData?.substring(0, 200) || 'No cleaned data',
          hasMarkdownBlocks: analysisData?.includes('```') || false,
          hasJsonStart: analysisData?.includes('{') || false,
          hasJsonEnd: analysisData?.includes('}') || false,
          modelUsed: reportModel,
          reportGenerationStep: 'structured_analysis_parsing_failed'
        });
        
        // Attempt basic content analysis even if JSON parsing fails
        devLog('Attempting fallback content analysis...');
        try {
          // Extract basic insights from the human-readable report
          parsedAnalysis = generateFallbackAnalysis(completion);
          devLog('Successfully generated fallback analysis from human-readable content');
          
          logger.info('Fallback analysis generated successfully', {
            ...context,
            fallbackStrategy: 'human_readable_content_analysis',
            extractedInsights: Object.keys(parsedAnalysis).length
          });
        } catch (fallbackError) {
          logger.error('Fallback analysis also failed', {
            ...context,
            fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
          // Continue with empty analysis - the human-readable report is still valuable
        }
      }
    }

    // Include CBT data in parsed analysis if available
    if (cbtData && dataSource !== 'none') {
      devLog(`Integrating CBT data from ${dataSource} source into analysis...`);
      logger.therapeuticOperation('CBT data integration analysis', {
        hasEmotion: !!cbtData.emotions,
        hasThoughts: !!cbtData.thoughts,
        hasCoreBeliefs: !!cbtData.coreBeliefs,
        hasActionPlan: !!cbtData.actionPlan,
        hasSchemaModes: !!cbtData.schemaModes,
        dataSize: JSON.stringify(cbtData).length,
        source: dataSource
      });
      
      // CBT data parsed from structured messages is reliable
      const dataReliability = 90;
      
      // Add CBT-specific insights to the analysis
      parsedAnalysis.userDataIntegration = {
        userRatingsUsed: !!cbtData.emotions,
        userAssessmentCount: [
          cbtData.situation,
          cbtData.emotions,
          cbtData.thoughts,
          cbtData.coreBeliefs,
          cbtData.actionPlan
        ].filter(Boolean).length,
        userInsightsPrioritized: true
      };
      
      parsedAnalysis.contentTierMetadata = {
        tier: 'structured-cbt',
        analysisScope: 'comprehensive', 
        userDataReliability: dataReliability,
        dataSource: dataSource
      };
      
      // Enhance key points with CBT summary
      if (!parsedAnalysis.keyPoints) {
        parsedAnalysis.keyPoints = [];
      }
      
      if (Array.isArray(parsedAnalysis.keyPoints)) {
        parsedAnalysis.keyPoints.push(`CBT Session Summary (${dataSource}): ${cbtSummary}`);
      }
      
      // Add CBT-specific therapeutic insights
      if (!parsedAnalysis.therapeuticInsights) {
        parsedAnalysis.therapeuticInsights = {};
      }
      
      if (typeof parsedAnalysis.therapeuticInsights === 'object' && parsedAnalysis.therapeuticInsights !== null) {
      logger.therapeuticOperation('CBT data inclusion in therapeutic insights', {
          dataSource,
          hasData: !!cbtData,
          dataKeyCount: Object.keys(cbtData).length,
          structuredAssessmentSize: JSON.stringify(cbtData).length
        });
        
        const insights = parsedAnalysis.therapeuticInsights as Record<string, unknown>;
        insights.cbtDataAvailable = true;
        insights.dataSource = dataSource;
        insights.structuredAssessment = cbtData;
        insights.emotionalProgress = cbtData.emotionComparison?.changes || [];
        
        logger.therapeuticOperation('CBT therapeutic insights integration completed', {
          insightKeyCount: Object.keys(insights).length,
          hasStructuredAssessment: !!insights.structuredAssessment
        });
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
        ...context,
        sessionId,
        reportLength: completion.length
      });
    } catch (dbError) {
      logger.error('Failed to save report to database', {
        ...context,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        sessionId
      });
      // Continue anyway - report generation is more important than storage
    }

    logger.info('Session report generated successfully', {
      ...context,
      modelUsed: reportModel,
      reportLength: completion.length,
      reportGenerationStep: 'completed_successfully',
      cbtDataSource: dataSource
    });

        return createSuccessResponse({
          reportContent: completion,
          modelUsed: reportModel,
          modelDisplayName: 'GPT OSS 120B (Deep Analysis)',
          cbtDataSource: dataSource,
          cbtDataAvailable: dataSource !== 'none'
        }, { requestId: context.requestId });
      },
      undefined, // No additional resource identifier needed
      30000 // 30 second TTL for report generation deduplication
    );

  } catch (error) {
    logger.apiError('/api/reports/generate', error as Error, context);
    return createErrorResponse('Failed to generate report', 500, { requestId: context.requestId });
  }
});