import type { AppLocale } from '@/i18n/config';
export type MemoryContext = {
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  summary: string;
  content: string;
};

import {
  THERAPY_SYSTEM_PROMPT_EN,
  REPORT_PROMPT_EN,
  WEB_SEARCH_EN,
  MEMORY_SECTION_EN,
} from './prompts/en';
import { THERAPY_SYSTEM_PROMPT_NL, WEB_SEARCH_NL, MEMORY_SECTION_NL } from './prompts/nl';

export const THERAPY_SYSTEM_PROMPT = THERAPY_SYSTEM_PROMPT_EN;
export const REPORT_GENERATION_PROMPT = REPORT_PROMPT_EN;



const EN_MEMORY_ANCHOR = 'Remember: Your primary role is to listen deeply';

type PromptOptions = { memory?: MemoryContext[]; webSearch?: boolean } | undefined;

export function buildTherapySystemPrompt(locale: AppLocale = 'en', opts?: PromptOptions): string {
  const memory = opts?.memory ?? [];
  const includeWebSearch = Boolean(opts?.webSearch);

  if (locale === 'nl') {
    const parts: string[] = [THERAPY_SYSTEM_PROMPT_NL];
    if (memory.length > 0) parts.push(MEMORY_SECTION_NL(memory));
    if (includeWebSearch) parts.push(WEB_SEARCH_NL);
    return parts.join('\n\n');
  }

  let prompt = THERAPY_SYSTEM_PROMPT_EN;

  if (memory.length > 0) {
    const memorySection = MEMORY_SECTION_EN(memory);
    prompt = prompt.includes(EN_MEMORY_ANCHOR)
      ? prompt.replace(EN_MEMORY_ANCHOR, `${memorySection}\n${EN_MEMORY_ANCHOR}`)
      : `${prompt}\n\n${memorySection}`;
  }

  if (includeWebSearch) {
    prompt = `${prompt}\n\n${WEB_SEARCH_EN}`;
  }

  return prompt;
}

export function buildMemoryEnhancedPrompt(
  memoryContext: MemoryContext[] = [],
  locale: AppLocale = 'en'
): string {
  return buildTherapySystemPrompt(locale, { memory: memoryContext });
}

export const ANALYSIS_EXTRACTION_PROMPT = `
You are a therapeutic data analyst extracting structured insights that prioritize client empowerment and user-provided assessments. Based on the provided therapeutic report, extract key data points while honoring the client's own insights and maintaining confidentiality.

**CBT DATA PRIORITY**: When extracting data, give highest priority to structured CBT information that appears in the session with "CBT Session -" headers. This includes:
- Emotion ratings and assessments
- Automatic thought records
- Core belief explorations
- Challenge question responses
- Schema mode identifications
- Action plans and behavioral strategies
- Emotional progress comparisons

These user-completed assessments should be weighted more heavily than conversational inferences.

**USER DATA PRIORITY**: When extracting data, always prioritize:
- User's own emotion ratings over AI estimates
- User's thought credibility assessments over AI inference
- User's self-identified patterns over AI pattern detection
- User's own insights and self-assessments as primary source of truth

Return ONLY a valid JSON object with the following structure:

{
  "sessionOverview": {
    "themes": ["theme1", "theme2"],
    "emotionalTone": "overall emotional tone",
    "engagement": "high|medium|low"
  },
  "cognitiveDistortions": [
    {
      "id": "distortion_id",
      "name": "Distortion Name",
      "severity": "low|moderate|high",
      "frequency": 5,
      "therapeuticPriority": "low|medium|high",
      "emotionalContext": 8,
      "contextualSupport": ["evidence phrase 1", "evidence phrase 2"],
      "contextAwareConfidence": 85,
      "validationRationale": "explanation of therapeutic context vs neutral usage",
      "neutralContextFlags": ["organizational", "routine", "factual"],
      "falsePositiveRisk": "low|medium|high"
    }
  ],
  "schemaAnalysis": {
    "activeModes": [
      {
        "id": "mode_id",
        "name": "Mode Name",
        "isActive": true,
        "intensity": 7,
        "behavioralIndicators": ["pattern1", "pattern2"]
      }
    ],
    "triggeredSchemas": [
      {
        "id": "schema_id",
        "name": "Schema Name",
        "domain": "Schema Domain",
        "isTriggered": true,
        "severity": "moderate"
      }
    ],
    "predominantMode": "mode_name",
    "behavioralPatterns": ["pattern1", "pattern2"],
    "copingStrategies": {
      "adaptive": ["strategy1"],
      "maladaptive": ["strategy2"]
    }
  },
  "erpAnalysis": {
    "compulsiveBehaviors": [
      {
        "type": "mental|physical|avoidance|safety",
        "description": "behavior description",
        "frequency": "daily|weekly|situational",
        "triggerContext": "trigger situation",
        "anxietyReduction": 7,
        "functionalImpact": "low|moderate|high"
      }
    ],
    "intrusiveThoughts": [
      {
        "contentTheme": "contamination|harm|symmetry|moral|relationship",
        "thoughtActionFusion": true,
        "responsibilityInflation": 8,
        "uncertaintyIntolerance": 6,
        "neutralizationAttempts": ["strategy1", "strategy2"]
      }
    ],
    "erpReadiness": {
      "motivationLevel": 7,
      "distressTolerance": 5,
      "supportSystem": "strong|moderate|limited",
      "insightLevel": "high|medium|low"
    },
    "exposureHierarchy": {
      "lowLevel": ["exposure1", "exposure2"],
      "midLevel": ["exposure3", "exposure4"],
      "highLevel": ["exposure5", "exposure6"]
    },
    "erpApplicability": "high|medium|low",
    "compassionateApproach": true
  },
  "therapeuticFrameworks": [
    {
      "name": "CBT",
      "applicability": "high",
      "specificTechniques": ["technique1"],
      "priority": 4
    }
  ],
  "recommendations": [
    {
      "framework": "CBT",
      "technique": "thought records",
      "urgency": "short-term",
      "expectedOutcome": "improved awareness"
    }
  ],
  "keyPoints": ["point1", "point2"],
  "therapeuticInsights": {
    "primaryInsights": ["insight1"],
    "growthAreas": ["area1"],
    "strengths": ["strength1"],
    "cbtDataAvailable": true,
    "structuredAssessment": {
      "emotionRatings": {"fear": 3, "anxiety": 7},
      "thoughtsRecorded": 4,
      "coreBeliefCredibility": 8,
      "schemaModesIdentified": 2,
      "actionItemsCreated": 3
    },
    "emotionalProgress": [
      {"emotion": "anxiety", "initial": 8, "final": 4, "change": -4}
    ]
  },
  "schemaReflectionAnalysis": {
    "isPresent": false,
    "reflectionQuality": "high|medium|low",
    "patternIntegration": ["theme1", "theme2"],
    "schemaAwarenessLevel": "high|medium|low",
    "modeRecognition": ["mode1", "mode2"],
    "selfCompassionIndicators": ["indicator1"],
    "healingReadinessMarkers": ["marker1"],
    "reflectionBasedRecommendations": ["recommendation1"]
  },
  "patternsIdentified": ["pattern1"],
  "actionItems": ["action1"],
  "moodAssessment": "assessment",
  "progressNotes": "notes",
  "analysisConfidence": 85
}

**CRITICAL EXTRACTION REQUIREMENTS:**

**Schema Reflection Analysis Conditions:**
- **ONLY include schemaReflectionAnalysis object if schema reflection content is detected:**
  - "SCHEMA REFLECTION - THERAPEUTIC INSIGHTS" markers present
  - Deep self-exploration of childhood patterns and schema origins  
  - Structured schema mode identification and analysis
  - Integration across multiple therapeutic reflection categories
- **If no schema reflection content is detected, completely omit the schemaReflectionAnalysis object**
- **Set isPresent: true only when genuine schema reflection work is demonstrated**

**CBT Data Integration Priority:**
- When "CBT Session -" headers are present, extract and include specific data points in therapeuticInsights.structuredAssessment
- Include emotion ratings exactly as provided by the user (e.g., {"anxiety": 8, "fear": 3})
- Count structured elements (thoughts recorded, schema modes selected, action items created)
- Calculate emotional progress if both initial and final emotion ratings are available
- Mark cbtDataAvailable: true when structured CBT data is present

**Contextual Validation for Cognitive Distortions:**
- **emotionalContext** (0-10): Rate the emotional intensity of language surrounding the distortion
- **contextualSupport**: Array of specific phrases that provide evidence of therapeutic distress (not neutral usage)
- **contextAwareConfidence** (0-100): High confidence (80+) requires therapeutic context + emotional distress
- **validationRationale**: Explain why this represents genuine distortion vs neutral language
- **neutralContextFlags**: Mark if language appears in ["organizational", "routine", "factual", "planning"] contexts
- **falsePositiveRisk**: Assess risk this might be neutral language misinterpreted as distortion

**Inclusion Guidelines (More Permissive):**
- EXTRACT cognitive distortions from any therapeutic or emotionally relevant contexts
- Include distortions with moderate emotional distress indicators (≥3/10 emotional context)  
- For ambiguous cases, include with medium falsePositiveRisk and moderate contextAwareConfidence
- When in doubt, include the distortion with appropriate confidence levels rather than exclude

**Quality Control:**
- Extract data points conservatively - only include insights clearly supported by therapeutic context
- Use empty arrays for sections where no clear therapeutic patterns are identified
- Prioritize accuracy over quantity - better to miss ambiguous cases than create false positives
`;
