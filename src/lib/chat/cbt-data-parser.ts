import { 
  CBTDiaryFormData, 
  CBTDiaryEmotions,
  NumericEmotionKeys, 
  CBTDiaryAutomaticThought, 
  CBTDiaryRationalThought,
  CBTDiarySchemaMode,
  CBTDiaryChallengeQuestion,
  CBTDiaryAlternativeResponse,
  SchemaReflectionData,
  SchemaReflectionCategory,
  DEFAULT_SCHEMA_MODES
} from '@/types/therapy';

export interface ParsedCBTData {
  formData: CBTDiaryFormData;
  isComplete: boolean;
  missingFields: string[];
  parsingErrors: string[];
}

/**
 * Parse a CBT diary entry from markdown content back to structured data
 * @param content - The markdown content from a chat message
 * @returns ParsedCBTData with reconstructed form data
 */
export function parseCBTFromMarkdown(content: string): ParsedCBTData {
  const result: ParsedCBTData = {
    formData: createEmptyFormData(),
    isComplete: false,
    missingFields: [],
    parsingErrors: []
  };

  try {
    // Extract basic information
    result.formData.date = extractDate(content) || new Date().toISOString().split('T')[0];
    result.formData.situation = extractSituation(content);

    // Extract emotions
    result.formData.initialEmotions = extractEmotions(content, 'initial') || createEmptyEmotions();
    result.formData.finalEmotions = extractEmotions(content, 'final') || createEmptyEmotions();

    // Extract thoughts
    result.formData.automaticThoughts = extractAutomaticThoughts(content);
    result.formData.rationalThoughts = extractRationalThoughts(content);

    // Extract schema analysis
    const schemaData = extractSchemaAnalysis(content);
    result.formData.coreBeliefText = schemaData.coreBeliefText;
    result.formData.coreBeliefCredibility = schemaData.coreBeliefCredibility;
    result.formData.confirmingBehaviors = schemaData.confirmingBehaviors;
    result.formData.avoidantBehaviors = schemaData.avoidantBehaviors;
    result.formData.overridingBehaviors = schemaData.overridingBehaviors;
    result.formData.schemaModes = extractSchemaModes(content);

    // Extract schema reflection
    result.formData.schemaReflection = extractSchemaReflection(content);

    // Extract challenge questions
    result.formData.challengeQuestions = extractChallengeQuestions(content);
    result.formData.additionalQuestions = extractAdditionalQuestions(content);

    // Extract final data
    result.formData.originalThoughtCredibility = extractOriginalThoughtCredibility(content);
    result.formData.newBehaviors = extractNewBehaviors(content);
    result.formData.alternativeResponses = extractAlternativeResponses(content);

    // Validate completeness
    const validation = validateParsedData(result.formData);
    result.isComplete = validation.isComplete;
    result.missingFields = validation.missingFields;

  } catch (error) {
    result.parsingErrors.push(
      error instanceof Error ? error.message : 'Unknown parsing error'
    );
  }

  return result;
}

function createEmptyFormData(): CBTDiaryFormData {
  return {
    date: new Date().toISOString().split('T')[0],
    situation: '',
    initialEmotions: createEmptyEmotions(),
    automaticThoughts: [],
    coreBeliefText: '',
    coreBeliefCredibility: 0,
    confirmingBehaviors: '',
    avoidantBehaviors: '',
    overridingBehaviors: '',
    schemaModes: DEFAULT_SCHEMA_MODES.map(mode => ({ ...mode, selected: false })),
    schemaReflection: {
      enabled: false,
      questions: [],
      selfAssessment: ''
    },
    challengeQuestions: [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' }
    ],
    additionalQuestions: [],
    rationalThoughts: [],
    finalEmotions: createEmptyEmotions(),
    originalThoughtCredibility: 0,
    newBehaviors: '',
    alternativeResponses: []
  };
}

function createEmptyEmotions(): CBTDiaryEmotions {
  return {
    fear: 0,
    anger: 0,
    sadness: 0,
    joy: 0,
    anxiety: 0,
    shame: 0,
    guilt: 0,
    other: '',
    otherIntensity: 0
  };
}

function extractDate(content: string): string | null {
  const patterns = [
    /\*\*Date:\*\*\s*([^\n\r]+)/i,
    /Date:\s*([^\n\r]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1].trim();
      // Try to parse various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  return null;
}

function extractSituation(content: string): string {
  const patterns = [
    /##\s*📍\s*Situation\s+Context[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
    /##\s*Situation\s*Context[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
    /##\s*Situation[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^\[|\]$/g, '');
    }
  }
  
  return '';
}

function extractEmotions(content: string, type: 'initial' | 'final'): CBTDiaryEmotions | null {
  const sectionPatterns = type === 'initial' 
    ? [/##\s*💭\s*(Emotional\s+Landscape|Initial\s+Emotions)[\s\S]+?(?=\n##|\n---|$)/i]
    : [/###?\s*(Updated\s+Feelings|Final\s+Emotions)[\s\S]+?(?=\n##|\n---|$)/i];
  
  for (const sectionPattern of sectionPatterns) {
    const sectionMatch = content.match(sectionPattern);
    if (sectionMatch) {
      const section = sectionMatch[0];
      const emotions = createEmptyEmotions();
      
      // Extract emotion ratings: "- Fear: 7/10"
      const emotionMatches = section.match(/-\s*([^:]+):\s*(\d+)\/10/gi);
      if (emotionMatches) {
        emotionMatches.forEach(match => {
          const [, name, intensity] = match.match(/-\s*([^:]+):\s*(\d+)\/10/i) || [];
          if (name && intensity) {
            const emotionName = name.trim().toLowerCase();
            const emotionValue = parseInt(intensity, 10);
            
            // Map to known numeric emotions only
            const emotionMap: Record<string, NumericEmotionKeys> = {
              'fear': 'fear',
              'anger': 'anger',
              'sadness': 'sadness',
              'joy': 'joy',
              'happiness': 'joy',
              'anxiety': 'anxiety',
              'shame': 'shame',
              'guilt': 'guilt'
            };
            
            if (emotionMap[emotionName]) {
              const emotionKey = emotionMap[emotionName];
              emotions[emotionKey] = emotionValue;
            } else {
              // Handle "other" emotions
              emotions.other = name.trim();
              emotions.otherIntensity = emotionValue;
            }
          }
        });
      }
      
      return emotions;
    }
  }
  
  return null;
}

function extractAutomaticThoughts(content: string): CBTDiaryAutomaticThought[] {
  const thoughts: CBTDiaryAutomaticThought[] = [];
  
  // Look for section with automatic thoughts
  const sectionMatch = content.match(/##\s*🧠\s*Automatic\s+Thoughts[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    
    // Extract thoughts with credibility: '- "thought" *(7/10)*'
    const thoughtMatches = section.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/gi);
    if (thoughtMatches) {
      thoughtMatches.forEach(match => {
        const [, thought, credibility] = match.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/i) || [];
        if (thought && credibility) {
          thoughts.push({
            thought: thought.trim(),
            credibility: parseInt(credibility, 10)
          });
        }
      });
    }
  }
  
  return thoughts;
}

function extractRationalThoughts(content: string): CBTDiaryRationalThought[] {
  const thoughts: CBTDiaryRationalThought[] = [];
  
  // Look for rational thoughts section
  const sectionMatch = content.match(/##\s*🔄?\s*Rational\s+Thoughts[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    
    // Extract thoughts with confidence: '- "thought" *(7/10)*'
    const thoughtMatches = section.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/gi);
    if (thoughtMatches) {
      thoughtMatches.forEach(match => {
        const [, thought, confidence] = match.match(/-\s*"([^"]+)"\s*\*\((\d+)\/10\)\*/i) || [];
        if (thought && confidence) {
          thoughts.push({
            thought: thought.trim(),
            confidence: parseInt(confidence, 10)
          });
        }
      });
    }
  }
  
  return thoughts;
}

function extractSchemaAnalysis(content: string): {
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
    overridingBehaviors: ''
  };
  
  // Find schema analysis section
  const sectionMatch = content.match(/##\s*🎯\s*Core\s+Schema\s+Analysis[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    
    // Extract credibility rating
    const credibilityMatch = section.match(/\*Credibility:\s*(\d+)\/10\*/i);
    if (credibilityMatch) {
      result.coreBeliefCredibility = parseInt(credibilityMatch[1], 10);
    }
    
    // Extract core belief
    const beliefMatch = section.match(/\*\*Core\s+Belief:\*\*\s*([^\n\r]+)/i);
    if (beliefMatch) {
      result.coreBeliefText = beliefMatch[1].trim().replace(/^\[|\]$/g, '');
    }
    
    // Extract behavioral patterns
    const confirmingMatch = section.match(/\*\*Confirming\s+behaviors:\*\*\s*([^\n\r]+)/i);
    if (confirmingMatch) {
      result.confirmingBehaviors = confirmingMatch[1].trim().replace(/^\[|\]$/g, '');
    }
    
    const avoidantMatch = section.match(/\*\*Avoidant\s+behaviors:\*\*\s*([^\n\r]+)/i);
    if (avoidantMatch) {
      result.avoidantBehaviors = avoidantMatch[1].trim().replace(/^\[|\]$/g, '');
    }
    
    const overridingMatch = section.match(/\*\*Overriding\s+behaviors:\*\*\s*([^\n\r]+)/i);
    if (overridingMatch) {
      result.overridingBehaviors = overridingMatch[1].trim().replace(/^\[|\]$/g, '');
    }
  }
  
  return result;
}

function extractSchemaModes(content: string): CBTDiarySchemaMode[] {
  const modes = DEFAULT_SCHEMA_MODES.map(mode => ({ ...mode, selected: false }));
  
  // Find active schema modes section
  const sectionMatch = content.match(/###?\s*Active\s+Schema\s+Modes[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    
    // Look for checked items: "- [x] The Vulnerable Child *(scared, helpless, needy)*"
    const modeMatches = section.match(/-\s*\[x\]\s*([^*\n]+)\s*\*\([^)]+\)\*/gi);
    if (modeMatches) {
      modeMatches.forEach(match => {
        const [, modeName] = match.match(/-\s*\[x\]\s*([^*\n]+)\s*\*\([^)]+\)\*/i) || [];
        if (modeName) {
          const name = modeName.trim();
          const mode = modes.find(m => m.name === name);
          if (mode) {
            mode.selected = true;
          }
        }
      });
    }
  }
  
  return modes;
}

function extractSchemaReflection(content: string): SchemaReflectionData {
  const reflection: SchemaReflectionData = {
    enabled: false,
    questions: [],
    selfAssessment: ''
  };
  
  // Check if schema reflection section exists
  const hasReflection = /##\s*🔍\s*SCHEMA\s+REFLECTION.*THERAPEUTIC\s+INSIGHTS/i.test(content);
  if (!hasReflection) {
    return reflection;
  }
  
  reflection.enabled = true;
  
  // Extract self-assessment
  const assessmentMatch = content.match(/###\s*🌱\s*Personal\s+Self-Assessment[\s\S]*?"([^"]+)"/i);
  if (assessmentMatch) {
    reflection.selfAssessment = assessmentMatch[1].trim();
  }
  
  // Extract reflection questions and insights
  const insightsSection = content.match(/###\s*🧭\s*Guided\s+Reflection\s+Insights([\s\S]*?)(?=\n##|\n---|$)/i);
  if (insightsSection) {
    const section = insightsSection[1];
    
    // Parse individual insights: "**💭 Modes Pattern:**"
    const insightMatches = section.match(/\*\*[💡👶🧠🛡️💭]\s*([^*]+)\s*Pattern:\*\*[^*]*\*Question:\*\s*"([^"]+)"[^*]*\*Insight:\*\s*"([^"]+)"/gi);
    if (insightMatches) {
      insightMatches.forEach(match => {
        const [, category, question, answer] = match.match(/\*\*[💡👶🧠🛡️💭]\s*([^*]+)\s*Pattern:\*\*[^*]*\*Question:\*\s*"([^"]+)"[^*]*\*Insight:\*\s*"([^"]+)"/i) || [];
        if (category && question && answer) {
          const categoryName = category.toLowerCase().trim();
          const validCategory: SchemaReflectionCategory = 
            ['childhood', 'schemas', 'coping', 'modes'].includes(categoryName) 
              ? categoryName as SchemaReflectionCategory
              : 'custom';
          
          reflection.questions.push({
            question: question.trim(),
            answer: answer.trim(),
            category: validCategory,
            isRequired: false
          });
        }
      });
    }
  }
  
  return reflection;
}

function extractChallengeQuestions(content: string): CBTDiaryChallengeQuestion[] {
  const questions: CBTDiaryChallengeQuestion[] = [];
  
  // Find challenge questions table
  const tableMatch = content.match(/##\s*Challenge\s+Questions[\s\S]*?\|[^|]+\|[^|]+\|([\s\S]*?)(?=\n##|\n---|$)/i);
  if (tableMatch) {
    const tableContent = tableMatch[1];
    
    // Parse table rows: "| Question text | Answer text |"
    const rowMatches = tableContent.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
    if (rowMatches) {
      rowMatches.forEach(row => {
        const [, question, answer] = row.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/) || [];
        if (question && answer) {
          const q = question.trim();
          const a = answer.trim();
          if (q !== 'Question' && q !== ' ' && (q || a)) { // Skip header and empty rows
            questions.push({
              question: q || '',
              answer: a === ' ' ? '' : a
            });
          }
        }
      });
    }
  }
  
  return questions;
}

function extractAdditionalQuestions(content: string): CBTDiaryChallengeQuestion[] {
  const questions: CBTDiaryChallengeQuestion[] = [];
  
  // Find additional questions table
  const tableMatch = content.match(/###\s*Additional\s+Questions[\s\S]*?\|[^|]+\|[^|]+\|([\s\S]*?)(?=\n##|\n---|$)/i);
  if (tableMatch) {
    const tableContent = tableMatch[1];
    
    // Parse table rows: "| Question text | Answer text |"
    const rowMatches = tableContent.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
    if (rowMatches) {
      rowMatches.forEach(row => {
        const [, question, answer] = row.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/) || [];
        if (question && answer) {
          const q = question.trim();
          const a = answer.trim();
          if (q !== 'Question' && q !== ' ' && (q || a)) { // Skip header and empty rows
            questions.push({
              question: q || '',
              answer: a === ' ' ? '' : a
            });
          }
        }
      });
    }
  }
  
  return questions;
}

function extractOriginalThoughtCredibility(content: string): number {
  const match = content.match(/\*\*Credibility\s+of\s+Original\s+Thoughts?:\*\*\s*(\d+)\/10/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractNewBehaviors(content: string): string {
  const patterns = [
    /###\s*New\s+Behaviors[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i,
    /\*\*New\s+Behaviors?\*\*[^\n]*\n([\s\S]+?)(?=\n##|\n---|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^\[|\]$/g, '');
    }
  }
  
  return '';
}

function extractAlternativeResponses(content: string): CBTDiaryAlternativeResponse[] {
  const responses: CBTDiaryAlternativeResponse[] = [];
  
  // Find alternative responses section
  const sectionMatch = content.match(/###\s*Alternative\s+Responses[\s\S]+?(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    const section = sectionMatch[0];
    
    // Extract list items: "- Response text"
    const responseMatches = section.match(/^-\s+([^\n\r]+)/gm);
    if (responseMatches) {
      responseMatches.forEach(match => {
        const [, response] = match.match(/-\s+([^\n\r]+)/) || [];
        if (response && response.trim() !== '[No alternative responses identified]') {
          responses.push({
            response: response.trim()
          });
        }
      });
    }
  }
  
  return responses;
}

function validateParsedData(formData: CBTDiaryFormData): { isComplete: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!formData.situation.trim()) {
    missingFields.push('situation');
  }
  
  // Check for at least one emotion
  const hasEmotions = Object.entries(formData.initialEmotions).some(([key, value]) => {
    if (key === 'other' || key === 'otherIntensity') return false;
    return typeof value === 'number' && value > 0;
  }) || (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0);
  
  if (!hasEmotions) {
    missingFields.push('initialEmotions');
  }
  
  // Check for at least one thought
  const hasThoughts = formData.automaticThoughts.some(t => t.thought.trim().length > 0);
  if (!hasThoughts) {
    missingFields.push('automaticThoughts');
  }
  
  if (!formData.coreBeliefText.trim()) {
    missingFields.push('coreBeliefText');
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}