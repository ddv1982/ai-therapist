import { generateSessionReport, extractStructuredAnalysis, type ReportMessage } from '@/lib/api/groq-client';
import { ANALYSIS_EXTRACTION_PROMPT_TEXT } from '@/lib/therapy/therapy-prompts';
import { getReportPrompt } from '@/lib/therapy/prompts';
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';
import { logger, devLog } from '@/lib/utils/logger';
import { encryptSessionReportContent, encryptEnhancedAnalysisData } from '@/lib/chat/message-encryption';
import { validateTherapeuticContext, calculateContextualConfidence } from '@/lib/therapy/context-validator';
import { parseAllCBTData, hasCBTData, generateCBTSummary } from '@/lib/therapy/cbt-data-parser';
import { generateFallbackAnalysis as generateFallbackAnalysisExternal } from '@/lib/reports/fallback-analysis';
import { getModelDisplayName, supportsWebSearch } from '@/ai/model-metadata';
import type { CBTStructuredAssessment } from '@/types/therapy';

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
  keyPoints?: unknown;
  therapeuticInsights?: unknown;
  patternsIdentified?: unknown;
  actionItems?: unknown;
  moodAssessment?: string;
  progressNotes?: string;
  analysisConfidence?: number;
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

interface ReportGenerationResult {
  reportContent: string;
  modelUsed: string;
  modelDisplayName: string;
  cbtDataSource: string;
  cbtDataAvailable: boolean;
}


export class ReportGenerationService {
  private reportModel: string;

  constructor(reportModel: string) {
    this.reportModel = reportModel;
  }

  /**
   * Generates fallback analysis when JSON parsing fails
   */
  private generateFallbackAnalysis(reportContent: string): ParsedAnalysis {
    return generateFallbackAnalysisExternal(reportContent) as unknown as ParsedAnalysis;
  }

  /**
   * Cleans and parses AI-generated JSON analysis data
   */
  private parseAnalysisData(analysisData: string): ParsedAnalysis {
    let cleanedData = analysisData.trim();

    // Remove markdown code blocks
    cleanedData = cleanedData.replace(/```json\s*/g, '');
    cleanedData = cleanedData.replace(/```\s*/g, '');
    cleanedData = cleanedData.replace(/\s*```$/g, '');

    // Remove common AI response prefixes/suffixes
    cleanedData = cleanedData.replace(/^Here's the structured analysis.*?:\s*/i, '');
    cleanedData = cleanedData.replace(/^Based on.*?:\s*/i, '');
    cleanedData = cleanedData.replace(/^The structured.*?:\s*/i, '');

    // Find JSON object boundaries
    const jsonStart = cleanedData.indexOf('{');
    const jsonEnd = cleanedData.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedData = cleanedData.substring(jsonStart, jsonEnd + 1);
    }

    // Remove trailing commas before closing brackets/braces
    cleanedData = cleanedData.replace(/,(\s*[}\]])/g, '$1');

    devLog(`Attempting to parse cleaned JSON data (${cleanedData.length} chars)`);
    const parsed = JSON.parse(cleanedData) as ParsedAnalysis;
    devLog('Successfully parsed structured analysis data');

    return parsed;
  }

  /**
   * Applies contextual validation to cognitive distortions
   */
  private applyContextualValidation(analysis: ParsedAnalysis, messages: ReportMessage[]): void {
    if (!analysis.cognitiveDistortions || !Array.isArray(analysis.cognitiveDistortions)) {
      return;
    }

    devLog('Applying contextual validation to cognitive distortions...');

    const fullConversationContent = messages.map(m => m.content).join(' ');
    const contextValidation = validateTherapeuticContext(fullConversationContent);

    analysis.cognitiveDistortions = (analysis.cognitiveDistortions as Array<{ contextAwareConfidence?: number; falsePositiveRisk?: string; name?: string }>)
      .map((distortion) => {
        if (typeof distortion.contextAwareConfidence === 'number') {
          const enhancedConfidence = calculateContextualConfidence(
            distortion.contextAwareConfidence,
            contextValidation,
            false
          );
          distortion.contextAwareConfidence = enhancedConfidence;
        }
        return distortion;
      })
      .filter((distortion) => {
        if (distortion.falsePositiveRisk === 'high' &&
          distortion.contextAwareConfidence && distortion.contextAwareConfidence < 60) {
          devLog(`Filtered out potential false positive: ${distortion.name}`);
          return false;
        }
        return true;
      });

    logger.info('Contextual validation applied to cognitive distortions', {
      originalCount: analysis.cognitiveDistortions.length,
      contextType: contextValidation.contextualAnalysis.contextType,
      emotionalIntensity: contextValidation.contextualAnalysis.emotionalIntensity,
      therapeuticRelevance: contextValidation.contextualAnalysis.therapeuticRelevance
    });
  }

  /**
   * Integrates CBT data into the parsed analysis
   */
  private integrateCBTData(analysis: ParsedAnalysis, cbtData: CBTStructuredAssessment, cbtSummary: string, dataSource: string): void {
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

    const dataReliability = 90;

    analysis.userDataIntegration = {
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

    analysis.contentTierMetadata = {
      tier: 'structured-cbt',
      analysisScope: 'comprehensive',
      userDataReliability: dataReliability,
      dataSource: dataSource
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
        structuredAssessmentSize: JSON.stringify(cbtData).length
      });

      const insights = analysis.therapeuticInsights as Record<string, unknown>;
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

  /**
   * Extracts and processes structured analysis from AI report
   */
  private async processStructuredAnalysis(completion: string, messages: ReportMessage[], _hasCBTContent: boolean): Promise<ParsedAnalysis> {
    devLog('Extracting structured analysis data...');
    const analysisData = await extractStructuredAnalysis(completion, ANALYSIS_EXTRACTION_PROMPT_TEXT, this.reportModel);

    let parsedAnalysis: ParsedAnalysis = {};

    if (analysisData) {
      try {
        parsedAnalysis = this.parseAnalysisData(analysisData);
        this.applyContextualValidation(parsedAnalysis, messages);
      } catch (error) {
        logger.error('JSON parsing failed for structured analysis', {
          error: error instanceof Error ? error.message : 'Unknown error',
          rawDataLength: analysisData?.length || 0,
          rawDataSample: analysisData?.substring(0, 200) || 'No data',
          hasMarkdownBlocks: analysisData?.includes('```') || false,
          hasJsonStart: analysisData?.includes('{') || false,
          hasJsonEnd: analysisData?.includes('}') || false,
          modelUsed: this.reportModel
        });

        devLog('Attempting fallback content analysis...');
        try {
          parsedAnalysis = this.generateFallbackAnalysis(completion);
          devLog('Successfully generated fallback analysis from human-readable content');

          logger.info('Fallback analysis generated successfully', {
            fallbackStrategy: 'human_readable_content_analysis',
            extractedInsights: Object.keys(parsedAnalysis).length
          });
        } catch (fallbackError) {
          logger.error('Fallback analysis also failed', {
            fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
        }
      }
    }

    return parsedAnalysis;
  }

  /**
   * Saves report to database with encryption
   */
  private async saveReportToDatabase(sessionId: string, completion: string, parsedAnalysis: ParsedAnalysis): Promise<void> {
    const encryptedReportContent = encryptSessionReportContent(completion);

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

    const encryptedAnalysisData = encryptEnhancedAnalysisData(enhancedAnalysisData);

    const client = getConvexHttpClient();
    await client.mutation(anyApi.reports.create, {
      sessionId,
      reportContent: encryptedReportContent,
      keyPoints: parsedAnalysis.keyPoints || [],
      therapeuticInsights: parsedAnalysis.therapeuticInsights || {},
      patternsIdentified: parsedAnalysis.patternsIdentified || [],
      actionItems: parsedAnalysis.actionItems || [],
      moodAssessment: parsedAnalysis.moodAssessment || '',
      progressNotes: parsedAnalysis.progressNotes || `Report generated on ${new Date().toISOString()}`,
      cognitiveDistortions: encryptedAnalysisData.cognitiveDistortions,
      schemaAnalysis: encryptedAnalysisData.schemaAnalysis,
      therapeuticFrameworks: encryptedAnalysisData.therapeuticFrameworks,
      recommendations: encryptedAnalysisData.recommendations,
      analysisConfidence: parsedAnalysis.analysisConfidence || 75,
      analysisVersion: "enhanced_v1.0"
    });

    logger.info('Session report saved to database for therapeutic memory', {
      sessionId,
      reportLength: completion.length
    });
  }

  /**
   * Main method to generate complete session report
   */
  async generateReport(sessionId: string, messages: ReportMessage[], locale: 'en' | 'nl'): Promise<ReportGenerationResult> {
    const modelDisplay = (() => {
      const base = getModelDisplayName(this.reportModel) || this.reportModel;
      return supportsWebSearch(this.reportModel) ? `${base} (Deep Analysis)` : base;
    })();

    logger.info('Report generation started', {
      sessionId,
      modelUsed: this.reportModel,
      modelDisplayName: modelDisplay,
      messageCount: messages.length
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
        dataSource: 'message-parsing'
      });
    }

    // Generate the human-readable session report using AI
    logger.info('Generating session report with AI model', {
      sessionId,
      modelUsed: this.reportModel,
      messageCount: messages.length
    });

    const reportPrompt = getReportPrompt(locale);
    const completion = await generateSessionReport(messages, reportPrompt, this.reportModel);

    if (!completion) {
      throw new Error('Failed to generate session report');
    }

    // Process structured analysis
    const parsedAnalysis = await this.processStructuredAnalysis(completion, messages, hasCBTContent);

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
        sessionId
      });
    }

    logger.info('Session report generated successfully', {
      sessionId,
      modelUsed: this.reportModel,
      reportLength: completion.length,
      cbtDataSource: dataSource
    });

    return {
      reportContent: completion,
      modelUsed: this.reportModel,
      modelDisplayName: modelDisplay,
      cbtDataSource: dataSource,
      cbtDataAvailable: dataSource !== 'none'
    };
  }
}
