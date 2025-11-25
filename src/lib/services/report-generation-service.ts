import {
  generateSessionReport,
  extractStructuredAnalysis,
  type ReportMessage,
} from '@/lib/api/groq-client';
import { ANALYSIS_EXTRACTION_PROMPT_TEXT } from '@/lib/therapy/therapy-prompts';
import { getReportPrompt } from '@/lib/therapy/therapy-prompts';
import type { ConvexHttpClient } from 'convex/browser';
import { anyApi } from '@/lib/convex/http-client';
import { logger, devLog } from '@/lib/utils/logger';
import {
  encryptSessionReportContent,
  encryptEnhancedAnalysisData,
} from '@/lib/chat/message-encryption';
import {
  validateTherapeuticContext,
  calculateContextualConfidence,
} from '@/lib/therapy/validators';
import { parseAllCBTData, hasCBTData, generateCBTSummary } from '@/lib/therapy/parsers';
import { getModelDisplayName, supportsWebSearch } from '@/ai/model-metadata';
import type { CBTStructuredAssessment } from '@/types';
import type { ParsedAnalysis } from '@/lib/therapy/analysis-schema';

interface ReportGenerationResult {
  reportContent: string;
  modelUsed: string;
  modelDisplayName: string;
  cbtDataSource: string;
  cbtDataAvailable: boolean;
}

export class ReportGenerationService {
  private reportModel: string;

  constructor(
    reportModel: string,
    private readonly convexClient: ConvexHttpClient
  ) {
    this.reportModel = reportModel;
  }

  /**
   * Note: Manual JSON parsing has been removed in favor of generateObject()
   * which uses Zod schemas for type-safe structured outputs from the AI SDK
   */

  /**
   * Applies contextual validation to cognitive distortions
   */
  private applyContextualValidation(analysis: ParsedAnalysis, messages: ReportMessage[]): void {
    if (!analysis.cognitiveDistortions || !Array.isArray(analysis.cognitiveDistortions)) {
      return;
    }

    devLog('Applying contextual validation to cognitive distortions...');

    const fullConversationContent = messages.map((m) => m.content).join(' ');
    const contextValidation = validateTherapeuticContext(fullConversationContent);

    const originalCount = analysis.cognitiveDistortions.length;

    analysis.cognitiveDistortions = analysis.cognitiveDistortions
      .map((distortion) => {
        if (typeof distortion.contextAwareConfidence === 'number') {
          const enhancedConfidence = calculateContextualConfidence(
            distortion.contextAwareConfidence,
            contextValidation,
            false
          );
          return {
            ...distortion,
            contextAwareConfidence: enhancedConfidence,
          };
        }
        return distortion;
      })
      .filter((distortion) => {
        if (
          distortion.falsePositiveRisk === 'high' &&
          distortion.contextAwareConfidence &&
          distortion.contextAwareConfidence < 60
        ) {
          devLog(`Filtered out potential false positive: ${distortion.name}`);
          return false;
        }
        return true;
      });

    logger.info('Contextual validation applied to cognitive distortions', {
      originalCount,
      filteredCount: analysis.cognitiveDistortions.length,
      contextType: contextValidation.contextualAnalysis.contextType,
      emotionalIntensity: contextValidation.contextualAnalysis.emotionalIntensity,
      therapeuticRelevance: contextValidation.contextualAnalysis.therapeuticRelevance,
    });
  }

  /**
   * Integrates CBT data into the parsed analysis
   */
  private integrateCBTData(
    analysis: ParsedAnalysis,
    cbtData: CBTStructuredAssessment,
    cbtSummary: string,
    dataSource: string
  ): void {
    devLog(`Integrating CBT data from ${dataSource} source into analysis...`);

    logger.therapeuticOperation('CBT data integration analysis', {
      hasEmotion: !!cbtData.emotions,
      hasThoughts: !!cbtData.thoughts,
      hasCoreBeliefs: !!cbtData.coreBeliefs,
      hasActionPlan: !!cbtData.actionPlan,
      hasSchemaModes: !!cbtData.schemaModes,
      dataSize: JSON.stringify(cbtData).length,
      source: dataSource,
    });

    const dataReliability = 90;

    analysis.userDataIntegration = {
      userRatingsUsed: !!cbtData.emotions,
      userAssessmentCount: [
        cbtData.situation,
        cbtData.emotions,
        cbtData.thoughts,
        cbtData.coreBeliefs,
        cbtData.actionPlan,
      ].filter(Boolean).length,
      userInsightsPrioritized: true,
    };

    analysis.contentTierMetadata = {
      tier: 'structured-cbt',
      analysisScope: 'comprehensive',
      userDataReliability: dataReliability,
      dataSource: dataSource,
    };

    if (!analysis.keyPoints) {
      analysis.keyPoints = [];
    }

    if (Array.isArray(analysis.keyPoints)) {
      analysis.keyPoints.push(`CBT Session Summary (${dataSource}): ${cbtSummary}`);
    }

    if (!analysis.therapeuticInsights) {
      analysis.therapeuticInsights = {};
    }

    if (typeof analysis.therapeuticInsights === 'object' && analysis.therapeuticInsights !== null) {
      logger.therapeuticOperation('CBT data inclusion in therapeutic insights', {
        dataSource,
        hasData: !!cbtData,
        dataKeyCount: Object.keys(cbtData).length,
        structuredAssessmentSize: JSON.stringify(cbtData).length,
      });

      const insights = analysis.therapeuticInsights as Record<string, unknown>;
      insights.cbtDataAvailable = true;
      insights.dataSource = dataSource;
      insights.structuredAssessment = cbtData;
      insights.emotionalProgress = cbtData.emotionComparison?.changes || [];

      logger.therapeuticOperation('CBT therapeutic insights integration completed', {
        insightKeyCount: Object.keys(insights).length,
        hasStructuredAssessment: !!insights.structuredAssessment,
      });
    }
  }

  /**
   * Extracts and processes structured analysis from AI report
   * Now uses generateObject() with Zod schemas for type-safe outputs
   */
  private async processStructuredAnalysis(
    completion: string,
    messages: ReportMessage[],
    _hasCBTContent: boolean
  ): Promise<ParsedAnalysis> {
    devLog('Extracting structured analysis data using generateObject...');

    try {
      const parsedAnalysis = await extractStructuredAnalysis(
        completion,
        ANALYSIS_EXTRACTION_PROMPT_TEXT,
        this.reportModel
      );

      // Apply contextual validation to cognitive distortions
      this.applyContextualValidation(parsedAnalysis, messages);

      logger.info('Structured analysis extracted successfully', {
        modelUsed: this.reportModel,
        hasCognitiveDistortions: !!parsedAnalysis.cognitiveDistortions?.length,
        hasSchemaAnalysis: !!parsedAnalysis.schemaAnalysis,
        analysisConfidence: parsedAnalysis.analysisConfidence,
      });

      return parsedAnalysis;
    } catch (error) {
      logger.error('Failed to extract structured analysis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        modelUsed: this.reportModel,
      });

      // Return empty analysis on failure - generateObject already handles retries
      return {};
    }
  }

  /**
   * Saves report to database with encryption
   */
  private async saveReportToDatabase(
    sessionId: string,
    completion: string,
    parsedAnalysis: ParsedAnalysis
  ): Promise<void> {
    const encryptedReportContent = encryptSessionReportContent(completion);

    const enhancedAnalysisData = {
      cognitiveDistortions: parsedAnalysis.cognitiveDistortions || [],
      schemaAnalysis: parsedAnalysis.schemaAnalysis || {
        activeModes: [],
        triggeredSchemas: [],
        predominantMode: null,
        behavioralPatterns: [],
        copingStrategies: { adaptive: [], maladaptive: [] },
        therapeuticRecommendations: [],
      },
      therapeuticFrameworks: parsedAnalysis.therapeuticFrameworks || [],
      recommendations: parsedAnalysis.recommendations || [],
    };

    const encryptedAnalysisData = encryptEnhancedAnalysisData(enhancedAnalysisData);

    await this.convexClient.mutation(anyApi.reports.create, {
      sessionId,
      reportContent: encryptedReportContent,
      keyPoints: parsedAnalysis.keyPoints || [],
      therapeuticInsights: parsedAnalysis.therapeuticInsights || {},
      patternsIdentified: parsedAnalysis.patternsIdentified || [],
      actionItems: parsedAnalysis.actionItems || [],
      moodAssessment: parsedAnalysis.moodAssessment || '',
      progressNotes:
        parsedAnalysis.progressNotes || `Report generated on ${new Date().toISOString()}`,
      cognitiveDistortions: encryptedAnalysisData.cognitiveDistortions,
      schemaAnalysis: encryptedAnalysisData.schemaAnalysis,
      therapeuticFrameworks: encryptedAnalysisData.therapeuticFrameworks,
      recommendations: encryptedAnalysisData.recommendations,
      analysisConfidence: parsedAnalysis.analysisConfidence || 75,
      analysisVersion: 'enhanced_v1.0',
    });

    logger.info('Session report saved to database for therapeutic memory', {
      sessionId,
      reportLength: completion.length,
    });
  }

  /**
   * Main method to generate complete session report
   */
  async generateReport(
    sessionId: string,
    messages: ReportMessage[],
    locale: 'en' | 'nl'
  ): Promise<ReportGenerationResult> {
    const modelDisplay = (() => {
      const base = getModelDisplayName(this.reportModel) || this.reportModel;
      return supportsWebSearch(this.reportModel) ? `${base} (Deep Analysis)` : base;
    })();

    logger.info('Report generation started', {
      sessionId,
      modelUsed: this.reportModel,
      modelDisplayName: modelDisplay,
      messageCount: messages.length,
    });

    // Check for CBT data in messages
    devLog('Checking messages for CBT content...');
    let cbtData: CBTStructuredAssessment | null = null;
    let cbtSummary = '';
    let dataSource = 'none';

    const hasCBTContent = hasCBTData(messages);

    if (hasCBTContent) {
      devLog('CBT data detected in messages, parsing structured information...');
      cbtData = parseAllCBTData(messages);
      cbtSummary = generateCBTSummary(cbtData);
      dataSource = 'parsed';

      logger.info('CBT data extracted from messages', {
        hasSituation: !!cbtData.situation,
        hasEmotions: !!cbtData.emotions,
        hasThoughts: !!cbtData.thoughts,
        hasCoreBeliefs: !!cbtData.coreBeliefs,
        hasActionPlan: !!cbtData.actionPlan,
        cbtSummaryLength: cbtSummary.length,
        dataSource: 'message-parsing',
      });
    }

    // Generate the human-readable session report using AI
    logger.info('Generating session report with AI model', {
      sessionId,
      modelUsed: this.reportModel,
      messageCount: messages.length,
    });

    const reportPrompt = getReportPrompt(locale);
    const completion = await generateSessionReport(messages, reportPrompt, this.reportModel);

    if (!completion) {
      throw new Error('Failed to generate session report');
    }

    // Process structured analysis
    const parsedAnalysis = await this.processStructuredAnalysis(
      completion,
      messages,
      hasCBTContent
    );

    // Integrate CBT data if available
    if (cbtData && dataSource !== 'none') {
      this.integrateCBTData(parsedAnalysis, cbtData, cbtSummary, dataSource);
    }

    // Save to database
    try {
      await this.saveReportToDatabase(sessionId, completion, parsedAnalysis);
    } catch (dbError) {
      logger.error('Failed to save report to database', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        sessionId,
      });
    }

    logger.info('Session report generated successfully', {
      sessionId,
      modelUsed: this.reportModel,
      reportLength: completion.length,
      cbtDataSource: dataSource,
    });

    return {
      reportContent: completion,
      modelUsed: this.reportModel,
      modelDisplayName: modelDisplay,
      cbtDataSource: dataSource,
      cbtDataAvailable: dataSource !== 'none',
    };
  }
}
