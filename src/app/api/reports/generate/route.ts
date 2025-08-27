import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport, extractStructuredAnalysis, type ReportMessage } from '@/lib/api/groq-client';
import { REPORT_GENERATION_PROMPT, ANALYSIS_EXTRACTION_PROMPT } from '@/lib/therapy/therapy-prompts';
import { prisma } from '@/lib/database/db';
import { logger, createRequestLogger, devLog } from '@/lib/utils/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/utils/validation';
import { encryptSessionReportContent, encryptEnhancedAnalysisData } from '@/lib/chat/message-encryption';
import { validateTherapeuticContext, calculateContextualConfidence } from '@/lib/therapy/context-validator';
import { parseAllCBTData, hasCBTData, generateCBTSummary } from '@/lib/therapy/cbt-data-parser';
import type { Prisma } from '@prisma/client';

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
function generateFallbackAnalysis(reportContent: string, _messages: ReportMessage[]): ParsedAnalysis {
  const fallbackAnalysis: ParsedAnalysis = {
    sessionOverview: {
      themes: extractThemes(reportContent),
      emotionalTone: extractEmotionalTone(reportContent),
      engagement: 'medium' // Default value since hard to extract
    },
    cognitiveDistortions: extractCognitiveDistortions(reportContent),
    schemaAnalysis: {
      activeModes: extractSchemaModes(reportContent),
      triggeredSchemas: [],
      behavioralPatterns: extractBehavioralPatterns(reportContent),
      predominantMode: null,
      copingStrategies: { adaptive: [], maladaptive: [] },
      therapeuticRecommendations: extractRecommendations(reportContent)
    },
    therapeuticFrameworks: extractTherapeuticFrameworks(reportContent),
    recommendations: [],
    keyPoints: extractKeyInsights(reportContent),
    therapeuticInsights: {
      primaryInsights: extractPrimaryInsights(reportContent),
      growthAreas: extractGrowthAreas(reportContent),
      strengths: extractClientStrengths(reportContent),
      fallbackGenerated: true // Flag to indicate this was a fallback analysis
    },
    patternsIdentified: extractIdentifiedPatterns(reportContent),
    actionItems: extractActionItems(reportContent),
    moodAssessment: extractMoodAssessment(reportContent),
    progressNotes: `Fallback analysis generated from human-readable report on ${new Date().toISOString()}`,
    analysisConfidence: 60, // Lower confidence for fallback analysis
    contentTierMetadata: {
      tier: 'fallback-analysis',
      analysisScope: 'basic',
      userDataReliability: 40,
      dataSource: 'human-readable-extraction'
    }
  };

  return fallbackAnalysis;
}

// Helper functions for fallback analysis
function extractThemes(content: string): string[] {
  const themes: string[] = [];
  const themePatterns = [
    /anxiety|worried|scared|fear/i,
    /depression|sad|hopeless|down/i,
    /relationships|family|friends|partner/i,
    /work|career|job|professional/i,
    /self-esteem|self-worth|confidence/i,
    /trauma|past|childhood/i,
    /stress|overwhelming|pressure/i,
    /anger|frustrated|irritated/i
  ];
  
  const themeNames = [
    'Anxiety and Fear', 'Depression and Mood', 'Relationships', 'Work/Career', 
    'Self-Esteem', 'Trauma/Past Experiences', 'Stress Management', 'Anger Management'
  ];
  
  themePatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      themes.push(themeNames[index]);
    }
  });
  
  return themes.length > 0 ? themes : ['General Wellbeing'];
}

function extractEmotionalTone(content: string): string {
  if (/distress|crisis|severe|intense|overwhelming/i.test(content)) return 'High emotional distress';
  if (/moderate|manageable|some difficulty/i.test(content)) return 'Moderate emotional engagement';
  if (/positive|hopeful|optimistic|progress/i.test(content)) return 'Positive emotional tone';
  return 'Balanced emotional presentation';
}

function extractCognitiveDistortions(content: string): unknown[] {
  const distortions: unknown[] = [];
  const distortionPatterns = [
    { name: 'Catastrophizing', pattern: /catastroph|worst.*case|disaster|terrible|awful/i },
    { name: 'All-or-Nothing Thinking', pattern: /always|never|everything|nothing|completely|totally/i },
    { name: 'Mind Reading', pattern: /think.*about.*me|judge|everyone.*knows/i },
    { name: 'Emotional Reasoning', pattern: /feel.*therefore|because.*feel|feel.*must.*be/i },
    { name: 'Should Statements', pattern: /should|must|ought.*to|have.*to/i }
  ];

  distortionPatterns.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      distortions.push({
        name,
        severity: 'moderate',
        contextAwareConfidence: 50, // Lower confidence for fallback
        falsePositiveRisk: 'medium',
        source: 'fallback-extraction'
      });
    }
  });

  return distortions;
}

function extractSchemaModes(content: string): unknown[] {
  const modes: unknown[] = [];
  const modePatterns = [
    { name: 'Vulnerable Child', pattern: /vulnerable|scared|helpless|abandoned|alone/i },
    { name: 'Angry Child', pattern: /angry|furious|rage|mad|frustrated/i },
    { name: 'Punitive Parent', pattern: /harsh.*self|critical|blame.*self|punish/i },
    { name: 'Demanding Parent', pattern: /perfect|standard|expect|demand|should/i },
    { name: 'Detached Protector', pattern: /detach|withdraw|avoid|distance|numb/i }
  ];

  modePatterns.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      modes.push({
        name,
        intensity: 5, // Default moderate intensity
        isActive: true,
        source: 'fallback-extraction'
      });
    }
  });

  return modes;
}

function extractBehavioralPatterns(content: string): string[] {
  const patterns: string[] = [];
  if (/avoid|withdrawal|isolat/i.test(content)) patterns.push('Avoidance behaviors');
  if (/perfectionist|control|check/i.test(content)) patterns.push('Perfectionist tendencies');
  if (/people.*pleas|approval.*seek/i.test(content)) patterns.push('People-pleasing behaviors');
  if (/procrastinat|delay|put.*off/i.test(content)) patterns.push('Procrastination patterns');
  return patterns;
}

function extractRecommendations(content: string): string[] {
  const recommendations: string[] = [];
  if (/cbt|cognitive.*behav/i.test(content)) recommendations.push('Cognitive Behavioral Therapy techniques');
  if (/mindful|meditat|breathe/i.test(content)) recommendations.push('Mindfulness and relaxation practices');
  if (/schema|mode/i.test(content)) recommendations.push('Schema therapy interventions');
  if (/exposure|gradual/i.test(content)) recommendations.push('Gradual exposure exercises');
  return recommendations;
}

function extractKeyInsights(content: string): string[] {
  // Extract sentences that appear to be key insights
  const insights: string[] = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  sentences.forEach(sentence => {
    if (/insight|pattern|understand|recogniz|aware/i.test(sentence)) {
      insights.push(sentence.trim());
    }
  });
  
  return insights.slice(0, 5); // Limit to 5 key insights
}

function extractPrimaryInsights(content: string): string[] {
  const insights: string[] = [];
  if (/strength|resilient|coping|resource/i.test(content)) {
    insights.push('Client demonstrates therapeutic resilience and coping resources');
  }
  if (/progress|growth|develop|improv/i.test(content)) {
    insights.push('Evidence of personal growth and therapeutic progress');
  }
  if (/aware|insight|understand|recogniz/i.test(content)) {
    insights.push('Increased self-awareness and emotional insight');
  }
  return insights;
}

function extractGrowthAreas(content: string): string[] {
  const areas: string[] = [];
  if (/anxiety|worry|fear/i.test(content)) areas.push('Anxiety management and emotional regulation');
  if (/relationship|communication/i.test(content)) areas.push('Interpersonal skills and relationship dynamics');
  if (/self.*esteem|confidence|worth/i.test(content)) areas.push('Self-esteem and self-acceptance');
  return areas;
}

function extractClientStrengths(content: string): string[] {
  const strengths: string[] = [];
  if (/open|honest|willing|engag/i.test(content)) strengths.push('Openness to therapeutic process');
  if (/insight|aware|understand/i.test(content)) strengths.push('Self-reflective capacity');
  if (/motiv|commit|effort/i.test(content)) strengths.push('Motivation for change');
  if (/support|friend|family/i.test(content)) strengths.push('Social support network');
  return strengths;
}

function extractIdentifiedPatterns(content: string): string[] {
  const patterns: string[] = [];
  if (/pattern|recurring|repeat/i.test(content)) {
    patterns.push('Recurring thought and behavior patterns identified');
  }
  if (/trigger|situation|when/i.test(content)) {
    patterns.push('Environmental and situational triggers recognized');
  }
  return patterns;
}

function extractActionItems(content: string): string[] {
  const actions: string[] = [];
  if (/practice|exercise|homework/i.test(content)) actions.push('Complete therapeutic exercises between sessions');
  if (/journal|write|record/i.test(content)) actions.push('Maintain therapeutic journaling practice');
  if (/mindful|meditat/i.test(content)) actions.push('Incorporate mindfulness practices into daily routine');
  return actions;
}

function extractMoodAssessment(content: string): string {
  if (/severe|crisis|high.*distress/i.test(content)) return 'High distress levels requiring immediate attention';
  if (/moderate|some.*difficulty/i.test(content)) return 'Moderate mood challenges with therapeutic potential';
  if (/stable|improving|positive/i.test(content)) return 'Stable mood with positive therapeutic indicators';
  return 'Mood assessment extracted from session content';
}

function extractTherapeuticFrameworks(content: string): unknown[] {
  const frameworks: unknown[] = [];
  
  if (/cbt|cognitive.*behav|thought.*record|automatic.*thought/i.test(content)) {
    frameworks.push({
      name: 'CBT',
      applicability: 'high',
      specificTechniques: ['Thought record work', 'Cognitive restructuring'],
      priority: 4
    });
  }
  
  if (/schema|mode|early.*maladaptiv/i.test(content)) {
    frameworks.push({
      name: 'Schema Therapy',
      applicability: 'high',
      specificTechniques: ['Mode work', 'Schema exploration'],
      priority: 3
    });
  }
  
  if (/mindful|meditat|present.*moment|acceptance/i.test(content)) {
    frameworks.push({
      name: 'Mindfulness-Based Therapy',
      applicability: 'medium',
      specificTechniques: ['Mindfulness exercises', 'Present-moment awareness'],
      priority: 2
    });
  }
  
  if (/exposure|gradual|hierarchy|systematic/i.test(content)) {
    frameworks.push({
      name: 'Exposure Therapy',
      applicability: 'medium',
      specificTechniques: ['Gradual exposure', 'Response prevention'],
      priority: 3
    });
  }
  
  return frameworks;
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
        ...requestContext,
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
                  false // TODO: Add CBT alignment check
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
          ...requestContext,
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
          parsedAnalysis = generateFallbackAnalysis(completion, messages);
          devLog('Successfully generated fallback analysis from human-readable content');
          
          logger.info('Fallback analysis generated successfully', {
            ...requestContext,
            fallbackStrategy: 'human_readable_content_analysis',
            extractedInsights: Object.keys(parsedAnalysis).length
          });
        } catch (fallbackError) {
          logger.error('Fallback analysis also failed', {
            ...requestContext,
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
      reportGenerationStep: 'completed_successfully',
      cbtDataSource: dataSource
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report generated successfully',
      reportContent: completion,
      modelUsed: reportModel, // Include model info in response
      modelDisplayName: 'GPT OSS 120B (Deep Analysis)',
      cbtDataSource: dataSource, // Indicate data source for debugging
      cbtDataAvailable: dataSource !== 'none'
    });

  } catch (error) {
    logger.apiError('/api/reports/generate', error as Error, createRequestLogger(request));
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}