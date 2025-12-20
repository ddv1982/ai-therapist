import { logger } from '@/lib/utils/logger';
import type {
  CBTStructuredAssessment,
  CBTFormData,
  EmotionData,
  NumericEmotionKeys,
  ThoughtData,
  RationalThoughtData,
  SchemaMode,
  ChallengeQuestionData,
  SchemaReflectionData,
  ParsedCBTData,
  SchemaReflectionCategory,
} from '@/types';
import { safeParseFromMatch } from '@/lib/utils/helpers';

export type { CBTStructuredAssessment, ParsedCBTData } from '@/types';

// ========================================
// CARD FORMAT EXTRACTION
// ========================================

type CardData = {
  situation?: string;
  date?: string;
  initialEmotions?: Array<{ emotion: string; rating: number }>;
  finalEmotions?: Array<{ emotion: string; rating: number }>;
  automaticThoughts?: Array<{ thought: string }>;
  coreBelief?: { belief?: string; credibility?: number };
  rationalThoughts?: Array<{ thought: string }>;
  schemaModes?: Array<{ name: string; intensity?: number }>;
  newBehaviors?: string[];
  alternativeResponses?: Array<{ response: string }>;
};

function validateCBTData(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

export function extractCBTDataFromCardFormat(content: string): CBTStructuredAssessment | null {
  const cardPattern = /<!-- CBT_SUMMARY_CARD:(.*?) -->/;
  const match = content.match(cardPattern);
  if (!match) return null;

  const parsed = safeParseFromMatch<unknown>(match[1]);
  if (!parsed.ok) {
    logger.warn('Failed to parse card format CBT data', { error: 'invalid_json' });
    return null;
  }
  const cardData = parsed.data as Partial<CardData>;
  logger.therapeuticOperation('CBT card format detected', { hasData: true, cardFormat: 'unified' });

  if (!validateCBTData(cardData)) {
    logger.warn('Invalid CBT data structure during parsing', { dataType: typeof cardData });
    return null;
  }

  const extractedData: CBTStructuredAssessment = {};

  if (cardData.situation) {
    extractedData.situation = {
      date: String(cardData.date || 'Unknown'),
      description: String(cardData.situation || 'No description'),
    };
  }

  if (Array.isArray(cardData.initialEmotions) && cardData.initialEmotions.length > 0) {
    const emotions: Record<string, number> = {};
    cardData.initialEmotions.forEach((emotion: { emotion: string; rating: number }) => {
      emotions[emotion.emotion] = emotion.rating;
    });
    extractedData.emotions = { initial: emotions };
    if (Array.isArray(cardData.finalEmotions) && cardData.finalEmotions.length > 0) {
      const finalEmotions: Record<string, number> = {};
      cardData.finalEmotions.forEach((emotion: { emotion: string; rating: number }) => {
        finalEmotions[emotion.emotion] = emotion.rating;
      });
      extractedData.emotions.final = finalEmotions;
    }
  }

  if (Array.isArray(cardData.automaticThoughts) && cardData.automaticThoughts.length > 0) {
    extractedData.thoughts = {
      automaticThoughts: cardData.automaticThoughts.map((t: { thought: string }) => t.thought),
    };
  }

  if (cardData.coreBelief && typeof cardData.coreBelief === 'object') {
    const coreBelief = cardData.coreBelief as Record<string, unknown>;
    extractedData.coreBeliefs = {
      belief: String(coreBelief.belief || 'No belief'),
      credibility: Number(coreBelief.credibility || 0),
    };
  }

  if (Array.isArray(cardData.rationalThoughts) && cardData.rationalThoughts.length > 0) {
    extractedData.rationalThoughts = {
      thoughts: cardData.rationalThoughts.map((t: { thought: string }) => t.thought),
    };
  }

  if (Array.isArray(cardData.schemaModes) && cardData.schemaModes.length > 0) {
    extractedData.schemaModes = cardData.schemaModes.map(
      (mode: { name: string; intensity?: number }) => ({
        name: mode.name,
        intensity: mode.intensity || 0,
        description: mode.name,
      })
    );
  }

  if (Array.isArray(cardData.newBehaviors) || Array.isArray(cardData.alternativeResponses)) {
    extractedData.actionPlan = {
      newBehaviors: Array.isArray(cardData.newBehaviors) ? cardData.newBehaviors : [],
      ...(Array.isArray(cardData.alternativeResponses)
        ? {
            alternativeResponses: (
              cardData.alternativeResponses as Array<{ response: string }>
            ).map((r) => (typeof r?.response === 'string' ? r.response : String(r || ''))),
          }
        : {}),
    };
  }

  return extractedData;
}

// ========================================
// OLD FORMAT EXTRACTORS
// ========================================

export function extractSituationData(content: string): CBTStructuredAssessment['situation'] | null {
  const situationMatch = content.match(
    /\*\*CBT Session - Situation Analysis\*\*[\s\S]*?📅 \*\*Date\*\*: (.+?)\n.*?📝 \*\*Situation\*\*: ([\s\S]*?)(?:\n---|$)/
  );
  if (!situationMatch) return null;
  return { date: situationMatch[1].trim(), description: situationMatch[2].trim() };
}

export function extractEmotionData(content: string): CBTStructuredAssessment['emotions'] | null {
  const emotionMatch = content.match(
    /\*\*CBT Session - Emotion Assessment\*\*[\s\S]*?💭 \*\*Current Emotional State\*\*:\n([\s\S]*?)(?:\n\*\*Total Emotions|$)/
  );
  if (!emotionMatch) return null;
  const emotionLines = emotionMatch[1].trim().split('\n');
  const emotions: Record<string, number> = {};
  let customEmotion: string | undefined;
  for (const line of emotionLines) {
    const match = line.match(/• \*\*(.+?)\*\*: (\d+)\/10/);
    if (match) {
      const emotionName = match[1].toLowerCase();
      const value = parseInt(match[2], 10);
      const standardEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'];
      if (standardEmotions.includes(emotionName)) {
        emotions[emotionName] = value;
      } else {
        emotions.other = value;
        customEmotion = match[1];
      }
    }
  }
  return { initial: emotions, customEmotion };
}

export function extractThoughtsData(content: string): CBTStructuredAssessment['thoughts'] | null {
  const thoughtsMatch = content.match(
    /\*\*CBT Session - Automatic Thoughts\*\*[\s\S]*?🧠 \*\*Identified Thoughts\*\*:\n([\s\S]*?)(?:\n\*\*Total Thoughts|$)/
  );
  if (!thoughtsMatch) return null;
  const thoughtLines = thoughtsMatch[1].trim().split('\n');
  const thoughts: string[] = [];
  for (const line of thoughtLines) {
    const match = line.match(/\d+\. "(.+?)"/);
    if (match) thoughts.push(match[1]);
  }
  return { automaticThoughts: thoughts };
}

export function extractCoreBeliefData(
  content: string
): CBTStructuredAssessment['coreBeliefs'] | null {
  const beliefMatch = content.match(
    /\*\*CBT Session - Core Belief Exploration\*\*[\s\S]*?🎯 \*\*Identified Core Belief\*\*: "(.+?)"\n📊 \*\*Belief Strength\*\*: (\d+)\/10/
  );
  if (!beliefMatch) return null;
  return { belief: beliefMatch[1], credibility: parseInt(beliefMatch[2], 10) };
}

export function extractChallengeData(
  content: string
): CBTStructuredAssessment['challengeQuestions'] | null {
  const challengeMatch = content.match(
    /\*\*CBT Session - Thought Challenging\*\*[\s\S]*?❓ \*\*Challenge Questions & Responses\*\*:\n\n([\s\S]*?)(?:\n\*\*Total Questions|$)/
  );
  if (!challengeMatch) return null;
  const questionBlocks = challengeMatch[1].split('\n\n');
  const questions: Array<{ question: string; answer: string }> = [];
  for (const block of questionBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const questionMatch = lines[0].match(/\*\*Question \d+\*\*: (.+)/);
      const answerMatch = lines[1].match(/\*\*Answer\*\*: (.+)/);
      if (questionMatch && answerMatch) {
        questions.push({ question: questionMatch[1], answer: answerMatch[1] });
      }
    }
  }
  return questions;
}

export function extractRationalThoughtsData(
  content: string
): CBTStructuredAssessment['rationalThoughts'] | null {
  const rationalMatch = content.match(
    /\*\*CBT Session - Rational Response Development\*\*[\s\S]*?💡 \*\*Alternative Rational Thoughts\*\*:\n([\s\S]*?)(?:\n\*\*Total Rational|$)/
  );
  if (!rationalMatch) return null;
  const thoughtLines = rationalMatch[1].trim().split('\n');
  const thoughts: string[] = [];
  for (const line of thoughtLines) {
    const match = line.match(/\d+\. "(.+?)"/);
    if (match) thoughts.push(match[1]);
  }
  return { thoughts };
}

export function extractSchemaModesData(
  content: string
): CBTStructuredAssessment['schemaModes'] | null {
  const modesMatch = content.match(
    /\*\*CBT Session - Schema Mode Analysis\*\*[\s\S]*?👥 \*\*Active Schema Modes\*\*:\n([\s\S]*?)(?:\n\*\*Total Active|$)/
  );
  if (!modesMatch) return null;
  const modeLines = modesMatch[1].trim().split('\n');
  const modes: Array<{ name: string; intensity: number; description: string }> = [];
  for (const line of modeLines) {
    const match = line.match(/• \*\*(.+?)\*\* \((\d+)\/10\): (.+)/);
    if (match)
      modes.push({ name: match[1], intensity: parseInt(match[2], 10), description: match[3] });
  }
  return modes;
}

export function extractActionPlanData(
  content: string
): CBTStructuredAssessment['actionPlan'] | null {
  const actionMatch = content.match(
    /\*\*CBT Session - Action Plan & Final Assessment\*\*[\s\S]*?🎯 \*\*New Behaviors to Practice\*\*:\n([\s\S]*?)(?:\n😌|\*\*Final|$)/
  );
  if (!actionMatch) return null;
  const behaviorLines = actionMatch[1].trim().split('\n');
  const newBehaviors: string[] = [];
  for (const line of behaviorLines) {
    const match = line.match(/\d+\. (.+)/);
    if (match) newBehaviors.push(match[1]);
  }
  return { newBehaviors };
}

export function extractEmotionComparison(
  content: string
): CBTStructuredAssessment['emotionComparison'] | null {
  const comparisonMatch = content.match(
    /📊 \*\*Emotional Changes During Session\*\*:\n\n([\s\S]*?)(?:\n\*\*Total Changes|$)/
  );
  if (!comparisonMatch) return null;
  const changeLines = comparisonMatch[1].trim().split('\n');
  const changes: Array<{
    emotion: string;
    initial: number;
    final: number;
    direction: 'increased' | 'decreased';
    change: number;
  }> = [];
  for (const line of changeLines) {
    const match = line.match(
      /(↗️|↘️) \*\*(.+?)\*\*: (\d+) → (\d+) \((increased|decreased) by (\d+)\)/
    );
    if (match) {
      const emotion = match[2].toLowerCase();
      const initial = parseInt(match[3], 10);
      const final = parseInt(match[4], 10);
      const direction = match[5] as 'increased' | 'decreased';
      const change = parseInt(match[6], 10);
      changes.push({ emotion, initial, final, direction, change });
    }
  }
  return { changes };
}

// ========================================
// MARKDOWN-TO-STRUCTURED PARSER (DIARY)
// ========================================

type ExtendedForm = CBTFormData & {
  confirmingBehaviors?: string;
  avoidantBehaviors?: string;
  overridingBehaviors?: string;
  schemaReflection?: SchemaReflectionData;
  additionalQuestions?: ChallengeQuestionData[];
};

const DEFAULT_SCHEMA_MODES: SchemaMode[] = [
  {
    id: 'Vulnerable Child',
    name: 'Vulnerable Child',
    description: '',
    selected: false,
    intensity: 0,
  },
  { id: 'Angry Child', name: 'Angry Child', description: '', selected: false, intensity: 0 },
  {
    id: 'Detached Protector',
    name: 'Detached Protector',
    description: '',
    selected: false,
    intensity: 0,
  },
  { id: 'Healthy Adult', name: 'Healthy Adult', description: '', selected: false, intensity: 0 },
];

function createEmptyFormData(): ExtendedForm {
  return {
    date: new Date().toISOString().split('T')[0],
    situation: '',
    initialEmotions: createEmptyEmotions(),
    automaticThoughts: [],
    coreBeliefText: '',
    coreBeliefCredibility: 0,
    schemaModes: DEFAULT_SCHEMA_MODES.map((mode) => ({ ...mode, selected: false })),
    challengeQuestions: [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' },
    ],
    rationalThoughts: [],
    finalEmotions: createEmptyEmotions(),
    originalThoughtCredibility: 0,
    newBehaviors: '',
  } as unknown as ExtendedForm;
}

function createEmptyEmotions(): EmotionData {
  return {
    fear: 0,
    anger: 0,
    sadness: 0,
    joy: 0,
    anxiety: 0,
    shame: 0,
    guilt: 0,
    other: '',
    otherIntensity: 0,
  };
}

function extractDateFromMarkdown(content: string): string | null {
  const patterns = [/\*\*Date:\*\*\s*([^\n\r]+)/i, /Date:\s*([^\n\r]+)/i];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1].trim();
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
  }
  return null;
}

function extractSituationFromMarkdown(content: string): string {
  const patterns = [
    /##\s*📍\s*Situation\s+Context[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
    /##\s*Situation\s*Context[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
    /##\s*Situation[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim().replace(/^\[|\]$/g, '');
  }
  return '';
}

function extractEmotionsFromMarkdown(
  content: string,
  type: 'initial' | 'final'
): EmotionData | null {
  const sectionPatterns =
    type === 'initial'
      ? [/##\s*💭\s*(Emotional\s+Landscape|Initial\s+Emotions)[\s\S]+?(?=\n##|\n---|$)/i]
      : [/###?\s*(Updated\s+Feelings|Final\s+Emotions)[\s\S]+?(?=\n##|\n---|$)/i];
  for (const sectionPattern of sectionPatterns) {
    const sectionMatch = content.match(sectionPattern);
    if (!sectionMatch) continue;
    const section = sectionMatch[0];
    const emotions = createEmptyEmotions();
    const emotionMatches = section.match(/-\s*([^:]+):\s*(\d+)\/10/gi);
    if (emotionMatches) {
      emotionMatches.forEach((m) => {
        const [, name, intensity] = m.match(/-\s*([^:]+):\s*(\d+)\/10/i) || [];
        if (name && intensity) {
          const emotionName = name.trim().toLowerCase();
          const emotionValue = parseInt(intensity, 10);
          const emotionMap: Record<string, NumericEmotionKeys> = {
            fear: 'fear',
            anger: 'anger',
            sadness: 'sadness',
            joy: 'joy',
            happiness: 'joy',
            anxiety: 'anxiety',
            shame: 'shame',
            guilt: 'guilt',
          };
          if (emotionMap[emotionName]) emotions[emotionMap[emotionName]] = emotionValue;
          else {
            emotions.other = name.trim();
            emotions.otherIntensity = emotionValue;
          }
        }
      });
    }
    return emotions;
  }
  return null;
}

function extractAutomaticThoughtsFromMarkdown(content: string): ThoughtData[] {
  const thoughts: ThoughtData[] = [];
  const sectionMatch = content.match(/##\s*🧠\s*Automatic\s+Thoughts[\s\S]+?(?=\n##|\n---|$)/i);
  if (!sectionMatch) return thoughts;
  const section = sectionMatch[0];
  const thoughtMatches = section.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/gi);
  if (thoughtMatches) {
    thoughtMatches.forEach((m) => {
      const [, thought, credibility] = m.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/i) || [];
      if (thought && credibility)
        thoughts.push({ thought: thought.trim(), credibility: parseInt(credibility, 10) });
    });
  }
  return thoughts;
}

function extractRationalThoughtsFromMarkdown(content: string): RationalThoughtData[] {
  const thoughts: RationalThoughtData[] = [];
  const sectionMatch = content.match(/##\s*🔄?\s*Rational\s+Thoughts[\s\S]+?(?=\n##|\n---|$)/i);
  if (!sectionMatch) return thoughts;
  const section = sectionMatch[0];
  const thoughtMatches = section.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/gi);
  if (thoughtMatches) {
    thoughtMatches.forEach((m) => {
      const [, thought, confidence] = m.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/i) || [];
      if (thought && confidence)
        thoughts.push({ thought: thought.trim(), confidence: parseInt(confidence, 10) });
    });
  }
  return thoughts;
}

function extractSchemaAnalysisFromMarkdown(content: string): {
  coreBeliefText: string;
  coreBeliefCredibility: number;
  confirmingBehaviors: string;
  avoidantBehaviors: string;
  overridingBehaviors: string;
} {
  const result = {
    coreBeliefText: '',
    coreBeliefCredibility: 0,
    confirmingBehaviors: '',
    avoidantBehaviors: '',
    overridingBehaviors: '',
  };
  const sectionMatch = content.match(/##\s*🎯\s*Core\s+Schema\s+Analysis[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    const credibilityMatch = section.match(/\*Credibility:\s*(\d+)\/10\*/i);
    if (credibilityMatch) result.coreBeliefCredibility = parseInt(credibilityMatch[1], 10);
    const beliefMatch = section.match(/\*\*Core\s+Belief:\*\*\s*([^\n\r]+)/i);
    if (beliefMatch) result.coreBeliefText = beliefMatch[1].trim().replace(/^\[|\]$/g, '');
    const confirmingMatch = section.match(/\*\*Confirming\s+behaviors:\*\*\s*([^\n\r]+)/i);
    if (confirmingMatch)
      result.confirmingBehaviors = confirmingMatch[1].trim().replace(/^\[|\]$/g, '');
    const avoidantMatch = section.match(/\*\*Avoidant\s+behaviors:\*\*\s*([^\n\r]+)/i);
    if (avoidantMatch) result.avoidantBehaviors = avoidantMatch[1].trim().replace(/^\[|\]$/g, '');
    const overridingMatch = section.match(/\*\*Overriding\s+behaviors:\*\*\s*([^\n\r]+)/i);
    if (overridingMatch)
      result.overridingBehaviors = overridingMatch[1].trim().replace(/^\[|\]$/g, '');
  }
  return result;
}

function extractSchemaModesFromMarkdown(content: string): SchemaMode[] {
  const modes = DEFAULT_SCHEMA_MODES.map((mode) => ({ ...mode, selected: false }));
  const sectionMatch = content.match(/###?\s*Active\s+Schema\s+Modes[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    const modeMatches = section.match(/-\s*\[x\]\s*([^*\n]+)\s*\*\([^)]+\)\*/gi);
    if (modeMatches) {
      modeMatches.forEach((m) => {
        const [, modeName] = m.match(/-\s*\[x\]\s*([^*\n]+)\s*\*\([^)]+\)\*/i) || [];
        if (modeName) {
          const name = modeName.trim();
          const mode = modes.find((mm) => mm.name === name);
          if (mode) mode.selected = true;
        }
      });
    }
  }
  return modes;
}

function extractSchemaReflectionFromMarkdown(content: string): SchemaReflectionData {
  const reflection: SchemaReflectionData = { enabled: false, questions: [], selfAssessment: '' };
  const hasReflection = /##\s*🔍\s*SCHEMA\s+REFLECTION.*THERAPEUTIC\s+INSIGHTS/i.test(content);
  if (!hasReflection) return reflection;
  reflection.enabled = true;
  const assessmentMatch = content.match(/###\s*🌱\s*Personal\s+Self-Assessment[\s\S]*?"([^"]+)"/i);
  if (assessmentMatch) reflection.selfAssessment = assessmentMatch[1].trim();
  const insightsSection = content.match(
    /###\s*🧭\s*Guided\s+Reflection\s+Insights([\s\S]*?)(?=\n##|\n---|$)/i
  );
  if (insightsSection) {
    const section = insightsSection[1];
    const insightMatches = section.match(
      /\*\*[💡👶🧠🛡️💭]\s*([^*]+)\s*Pattern:\*\*[^*]*\*Question:\*\s*"([^"]+)"[^*]*\*Insight:\*\s*"([^"]+)"/gi
    );
    if (insightMatches) {
      insightMatches.forEach((m) => {
        const [, category, question, answer] =
          m.match(
            /\*\*[💡👶🧠🛡️💭]\s*([^*]+)\s*Pattern:\*\*[^*]*\*Question:\*\s*"([^"]+)"[^*]*\*Insight:\*\s*"([^"]+)"/i
          ) || [];
        if (category && question && answer) {
          const categoryName = category.toLowerCase().trim();
          const validCategory: SchemaReflectionCategory = [
            'childhood',
            'schemas',
            'coping',
            'modes',
          ].includes(categoryName)
            ? (categoryName as SchemaReflectionCategory)
            : 'custom';
          reflection.questions.push({
            question: question.trim(),
            answer: answer.trim(),
            category: validCategory,
            isRequired: false,
          });
        }
      });
    }
  }
  return reflection;
}

function extractChallengeQuestionsFromMarkdown(content: string): ChallengeQuestionData[] {
  const questions: ChallengeQuestionData[] = [];
  const tableMatch = content.match(
    /##\s*Challenge\s+Questions[\s\S]*?\|[^|]+\|[^|]+\|([\s\S]*?)(?=\n##|\n---|$)/i
  );
  if (!tableMatch) return questions;
  const tableContent = tableMatch[1];
  const rowMatches = tableContent.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
  if (rowMatches) {
    rowMatches.forEach((row) => {
      const [, question, answer] = row.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/) || [];
      if (question && answer) {
        const q = question.trim();
        const a = answer.trim();
        if (q !== 'Question' && q !== ' ' && (q || a))
          questions.push({ question: q || '', answer: a === ' ' ? '' : a });
      }
    });
  }
  return questions;
}

function extractAdditionalQuestionsFromMarkdown(content: string): ChallengeQuestionData[] {
  const questions: ChallengeQuestionData[] = [];
  const tableMatch = content.match(
    /###\s*Additional\s+Questions[\s\S]*?\|[^|]+\|[^|]+\|([\s\S]*?)(?=\n##|\n---|$)/i
  );
  if (!tableMatch) return questions;
  const tableContent = tableMatch[1];
  const rowMatches = tableContent.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
  if (rowMatches) {
    rowMatches.forEach((row) => {
      const [, question, answer] = row.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/) || [];
      if (question && answer) {
        const q = question.trim();
        const a = answer.trim();
        if (q !== 'Question' && q !== ' ' && (q || a))
          questions.push({ question: q || '', answer: a === ' ' ? '' : a });
      }
    });
  }
  return questions;
}

function extractOriginalThoughtCredibilityFromMarkdown(content: string): number {
  const match = content.match(/\*\*Credibility\s+of\s+Original\s+Thoughts?:\*\*\s*(\d+)\/10/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractNewBehaviorsFromMarkdown(content: string): string {
  const patterns = [
    /###\s*New\s+Behaviors[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
    /\*\*New\s+Behaviors?\*\*[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim().replace(/^\[|\]$/g, '');
  }
  return '';
}

function validateParsedDataFromMarkdown(formData: CBTFormData): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  if (!formData.situation.trim()) missingFields.push('situation');
  const hasEmotions =
    Object.entries(formData.initialEmotions).some(([key, value]) => {
      if (key === 'other' || key === 'otherIntensity') return false;
      return typeof value === 'number' && value > 0;
    }) ||
    (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0);
  if (!hasEmotions) missingFields.push('initialEmotions');
  return { isComplete: missingFields.length === 0, missingFields };
}

export function parseCBTFromMarkdown(content: string): ParsedCBTData {
  const result: ParsedCBTData = {
    formData: createEmptyFormData(),
    isComplete: false,
    missingFields: [],
    parsingErrors: [],
  };
  try {
    result.formData.date =
      extractDateFromMarkdown(content) || new Date().toISOString().split('T')[0];
    result.formData.situation = extractSituationFromMarkdown(content);
    result.formData.initialEmotions =
      extractEmotionsFromMarkdown(content, 'initial') || createEmptyEmotions();
    result.formData.finalEmotions =
      extractEmotionsFromMarkdown(content, 'final') || createEmptyEmotions();
    result.formData.automaticThoughts = extractAutomaticThoughtsFromMarkdown(content);
    result.formData.rationalThoughts = extractRationalThoughtsFromMarkdown(content);
    const schemaData = extractSchemaAnalysisFromMarkdown(content);
    result.formData.coreBeliefText = schemaData.coreBeliefText;
    result.formData.coreBeliefCredibility = schemaData.coreBeliefCredibility;
    (result.formData as ExtendedForm).confirmingBehaviors = schemaData.confirmingBehaviors;
    (result.formData as ExtendedForm).avoidantBehaviors = schemaData.avoidantBehaviors;
    (result.formData as ExtendedForm).overridingBehaviors = schemaData.overridingBehaviors;
    result.formData.schemaModes = extractSchemaModesFromMarkdown(content);
    (result.formData as ExtendedForm).schemaReflection =
      extractSchemaReflectionFromMarkdown(content);
    result.formData.challengeQuestions = extractChallengeQuestionsFromMarkdown(content);
    (result.formData as ExtendedForm).additionalQuestions =
      extractAdditionalQuestionsFromMarkdown(content);
    result.formData.originalThoughtCredibility =
      extractOriginalThoughtCredibilityFromMarkdown(content);
    result.formData.newBehaviors = extractNewBehaviorsFromMarkdown(content);
    const validation = validateParsedDataFromMarkdown(result.formData);
    result.isComplete = validation.isComplete;
    result.missingFields = validation.missingFields;
  } catch (error) {
    result.parsingErrors.push(error instanceof Error ? error.message : 'Unknown parsing error');
  }
  return result;
}

// ========================================
// MAIN PARSING FUNCTIONS
// ========================================

type MessageLike = { content: string; role: string };

export function parseAllCBTData(
  messages: MessageLike[]
): import('@/types/domains/therapy').CBTStructuredAssessment {
  const extractedData: import('@/types/domains/therapy').CBTStructuredAssessment = {};
  let parsedSections = 0;

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue;
    const cardData = extractCBTDataFromCardFormat(message.content);
    if (cardData) {
      logger.therapeuticOperation('CBT card data extracted', {
        format: 'unified_card',
        success: true,
      });
      return cardData;
    }
  }

  logger.therapeuticOperation('CBT fallback to markdown parsing', { reason: 'no_card_format' });
  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue;
    const content = message.content;
    if (!content.includes('CBT Session -')) continue;

    if (content.includes('CBT Session - Situation Analysis')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const situationData = extractSituationData(content);
      if (situationData) {
        extractedData.situation = situationData;
        parsedSections++;
        logger.therapeuticOperation('CBT situation parsed', {
          hasDate: !!situationData.date,
          hasSituation: !!situationData.description,
        });
      }
    }
    if (content.includes('CBT Session - Emotion Assessment')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const emotionData = extractEmotionData(content);
      if (emotionData) {
        if (!extractedData.emotions) {
          extractedData.emotions = emotionData;
          parsedSections++;
          logger.therapeuticOperation('CBT initial emotions parsed', {
            emotionCount: Object.keys(emotionData.initial || {}).length,
          });
        } else if (!extractedData.emotions.final) {
          extractedData.emotions.final = emotionData.initial;
          logger.therapeuticOperation('CBT final emotions parsed', {
            emotionCount: Object.keys(emotionData.final || emotionData.initial || {}).length,
          });
        }
      }
    }
    if (content.includes('CBT Session - Automatic Thoughts')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const thoughtsData = extractThoughtsData(content);
      if (thoughtsData) {
        extractedData.thoughts = thoughtsData;
        parsedSections++;
        logger.therapeuticOperation('CBT thoughts parsed', {
          thoughtCount: thoughtsData.automaticThoughts?.length || 0,
        });
      }
    }
    if (content.includes('CBT Session - Core Belief Exploration')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const coreBeliefData = extractCoreBeliefData(content);
      if (coreBeliefData) {
        extractedData.coreBeliefs = coreBeliefData;
        parsedSections++;
        logger.therapeuticOperation('CBT core belief parsed', {
          hasCoreBelief: !!coreBeliefData.belief,
          credibility: typeof coreBeliefData.credibility === 'number',
        });
      }
    }
    if (content.includes('CBT Session - Thought Challenging')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const challengeData = extractChallengeData(content);
      if (challengeData) {
        extractedData.challengeQuestions = challengeData;
        parsedSections++;
        logger.therapeuticOperation('CBT challenges parsed', {
          questionCount: challengeData?.length || 0,
        });
      }
    }
    if (content.includes('CBT Session - Rational Response Development')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const rationalData = extractRationalThoughtsData(content);
      if (rationalData) {
        extractedData.rationalThoughts = rationalData;
        parsedSections++;
        logger.therapeuticOperation('CBT rational thoughts parsed', {
          thoughtCount: rationalData.thoughts?.length || 0,
        });
      }
    }
    if (content.includes('CBT Session - Schema Mode Analysis')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const schemaData = extractSchemaModesData(content);
      if (schemaData) {
        extractedData.schemaModes = schemaData;
        parsedSections++;
        logger.therapeuticOperation('CBT schema modes parsed', {
          modeCount: schemaData?.length || 0,
        });
      }
    }
    if (content.includes('CBT Session - Action Plan & Final Assessment')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const actionData = extractActionPlanData(content);
      if (actionData) {
        extractedData.actionPlan = actionData;
        parsedSections++;
        logger.therapeuticOperation('CBT action plan parsed', {
          behaviorCount: actionData.newBehaviors?.length || 0,
        });
      }
    }
    if (content.includes('Emotional Changes During Session')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const comparisonData = extractEmotionComparison(content);
      if (comparisonData) {
        extractedData.emotionComparison = comparisonData;
        parsedSections++;
        logger.therapeuticOperation('CBT emotion comparison parsed', {
          changeCount: comparisonData.changes?.length || 0,
        });
      }
    }
  }

  logger.therapeuticOperation('CBT parsing completed', {
    sectionsFound: parsedSections,
    hasSituation: !!extractedData.situation,
    hasEmotions: !!extractedData.emotions,
    hasThoughts: !!extractedData.thoughts,
    hasCoreBeliefs: !!extractedData.coreBeliefs,
    hasChallenges: !!extractedData.challengeQuestions,
    hasRationalThoughts: !!extractedData.rationalThoughts,
    hasSchemaModes: !!extractedData.schemaModes,
    hasActionPlan: !!extractedData.actionPlan,
    hasEmotionComparison: !!extractedData.emotionComparison,
  });
  return extractedData;
}

export function hasCBTData(messages: MessageLike[]): boolean {
  const foundOldFormat = messages.some(
    (m) => (m.role === 'user' || m.role === 'assistant') && m.content.includes('CBT Session -')
  );
  const foundNewFormat = messages.some(
    (m) =>
      (m.role === 'user' || m.role === 'assistant') && m.content.includes('<!-- CBT_SUMMARY_CARD:')
  );
  const foundCBT = foundOldFormat || foundNewFormat;
  logger.therapeuticOperation('CBT data detection completed', {
    foundCBT,
    oldFormat: foundOldFormat,
    newFormat: foundNewFormat,
    messagesChecked: messages.length,
  });
  return foundCBT;
}

// ========================================
// SUMMARY GENERATION
// ========================================

export function generateCBTSummary(cbtData: CBTStructuredAssessment): string {
  const sections: string[] = [];
  if (cbtData.situation) {
    sections.push(`**Situation**: ${cbtData.situation.description} (${cbtData.situation.date})`);
  }
  if (cbtData.emotions?.initial) {
    const emotionList = Object.entries(cbtData.emotions.initial)
      .filter(([, value]) => value > 0)
      .map(([emotion, value]) => `${emotion}: ${value}/10`)
      .join(', ');
    sections.push(`**Initial Emotions**: ${emotionList}`);
  }
  if (cbtData.thoughts?.automaticThoughts.length) {
    sections.push(
      `**Automatic Thoughts**: ${cbtData.thoughts.automaticThoughts.length} identified`
    );
  }
  if (cbtData.coreBeliefs) {
    sections.push(
      `**Core Belief**: "${cbtData.coreBeliefs.belief}" (${cbtData.coreBeliefs.credibility}/10 credibility)`
    );
  }
  if (cbtData.schemaModes?.length) {
    sections.push(`**Active Schema Modes**: ${cbtData.schemaModes.length} modes identified`);
  }
  if (cbtData.emotionComparison?.changes.length) {
    sections.push(
      `**Emotional Progress**: ${cbtData.emotionComparison.changes.length} emotions showed significant changes`
    );
  }
  return sections.join('\n\n');
}
