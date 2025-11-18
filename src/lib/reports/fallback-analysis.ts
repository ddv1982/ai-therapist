export interface ParsedAnalysis {
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
  userDataIntegration?: unknown;
  contentTierMetadata?: unknown;
}

export function generateFallbackAnalysis(reportContent: string): ParsedAnalysis {
  const fallbackAnalysis: ParsedAnalysis = {
    sessionOverview: {
      themes: extractThemes(reportContent),
      emotionalTone: extractEmotionalTone(reportContent),
      engagement: 'medium',
    },
    cognitiveDistortions: extractCognitiveDistortions(reportContent),
    schemaAnalysis: {
      activeModes: extractSchemaModes(reportContent),
      triggeredSchemas: [],
      behavioralPatterns: extractBehavioralPatterns(reportContent),
      predominantMode: null,
      copingStrategies: { adaptive: [], maladaptive: [] },
      therapeuticRecommendations: extractRecommendations(reportContent),
    },
    therapeuticFrameworks: extractTherapeuticFrameworks(reportContent),
    recommendations: [],
    keyPoints: extractKeyInsights(reportContent),
    therapeuticInsights: {
      primaryInsights: extractPrimaryInsights(reportContent),
      growthAreas: extractGrowthAreas(reportContent),
      strengths: extractClientStrengths(reportContent),
      fallbackGenerated: true,
    },
    patternsIdentified: extractIdentifiedPatterns(reportContent),
    actionItems: extractActionItems(reportContent),
    moodAssessment: extractMoodAssessment(reportContent),
    progressNotes: `Fallback analysis generated from human-readable report on ${new Date().toISOString()}`,
    analysisConfidence: 60,
    contentTierMetadata: {
      tier: 'fallback-analysis',
      analysisScope: 'basic',
      userDataReliability: 40,
      dataSource: 'human-readable-extraction',
    },
  };

  return fallbackAnalysis;
}

export function extractThemes(content: string): string[] {
  const themes: string[] = [];
  const themePatterns = [
    /anxiety|worried|scared|fear/i,
    /depression|sad|hopeless|down/i,
    /relationships|family|friends|partner/i,
    /work|career|job|professional/i,
    /self-esteem|self-worth|confidence/i,
    /trauma|past|childhood/i,
    /stress|overwhelming|pressure/i,
    /anger|frustrated|irritated/i,
  ];

  const themeNames = [
    'Anxiety and Fear',
    'Depression and Mood',
    'Relationships',
    'Work/Career',
    'Self-Esteem',
    'Trauma/Past Experiences',
    'Stress Management',
    'Anger Management',
  ];

  themePatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      themes.push(themeNames[index]);
    }
  });

  return themes.length > 0 ? themes : ['General Wellbeing'];
}

export function extractEmotionalTone(content: string): string {
  if (/distress|crisis|severe|intense|overwhelming/i.test(content))
    return 'High emotional distress';
  if (/moderate|manageable|some difficulty/i.test(content)) return 'Moderate emotional engagement';
  if (/positive|hopeful|optimistic|progress/i.test(content)) return 'Positive emotional tone';
  return 'Balanced emotional presentation';
}

export function extractCognitiveDistortions(content: string): unknown[] {
  const distortions: unknown[] = [];
  const distortionPatterns = [
    { name: 'Catastrophizing', pattern: /catastroph|worst.*case|disaster|terrible|awful/i },
    {
      name: 'All-or-Nothing Thinking',
      pattern: /always|never|everything|nothing|completely|totally/i,
    },
    { name: 'Mind Reading', pattern: /think.*about.*me|judge|everyone.*knows/i },
    { name: 'Emotional Reasoning', pattern: /feel.*therefore|because.*feel|feel.*must.*be/i },
    { name: 'Should Statements', pattern: /should|must|ought.*to|have.*to/i },
  ];

  distortionPatterns.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      distortions.push({
        name,
        severity: 'moderate',
        contextAwareConfidence: 50,
        falsePositiveRisk: 'medium',
        source: 'fallback-extraction',
      });
    }
  });

  return distortions;
}

export function extractSchemaModes(content: string): unknown[] {
  const modes: unknown[] = [];
  const modePatterns = [
    { name: 'Vulnerable Child', pattern: /vulnerable|scared|helpless|abandoned|alone/i },
    { name: 'Angry Child', pattern: /angry|furious|rage|mad|frustrated/i },
    { name: 'Punitive Parent', pattern: /harsh.*self|critical|blame.*self|punish/i },
    { name: 'Demanding Parent', pattern: /perfect|standard|expect|demand|should/i },
    { name: 'Detached Protector', pattern: /detach|withdraw|avoid|distance|numb/i },
  ];

  modePatterns.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      modes.push({ name, intensity: 5, isActive: true, source: 'fallback-extraction' });
    }
  });

  return modes;
}

export function extractBehavioralPatterns(content: string): string[] {
  const patterns: string[] = [];
  if (/avoid|withdrawal|isolat/i.test(content)) patterns.push('Avoidance behaviors');
  if (/perfectionist|control|check/i.test(content)) patterns.push('Perfectionist tendencies');
  if (/people.*pleas|approval.*seek/i.test(content)) patterns.push('People-pleasing behaviors');
  if (/procrastinat|delay|put.*off/i.test(content)) patterns.push('Procrastination patterns');
  return patterns;
}

export function extractRecommendations(content: string): string[] {
  const recommendations: string[] = [];
  if (/cbt|cognitive.*behav/i.test(content))
    recommendations.push('Cognitive Behavioral Therapy techniques');
  if (/mindful|meditat|breathe/i.test(content))
    recommendations.push('Mindfulness and relaxation practices');
  if (/schema|mode/i.test(content)) recommendations.push('Schema therapy interventions');
  if (/exposure|gradual/i.test(content)) recommendations.push('Gradual exposure exercises');
  return recommendations;
}

export function extractKeyInsights(content: string): string[] {
  const insights: string[] = [];
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  sentences.forEach((sentence) => {
    if (/insight|pattern|understand|recogniz|aware/i.test(sentence)) {
      insights.push(sentence.trim());
    }
  });
  return insights.slice(0, 5);
}

export function extractPrimaryInsights(content: string): string[] {
  const insights: string[] = [];
  if (/strength|resilient|coping|resource/i.test(content))
    insights.push('Client demonstrates therapeutic resilience and coping resources');
  if (/progress|growth|develop|improv/i.test(content))
    insights.push('Evidence of personal growth and therapeutic progress');
  if (/aware|insight|understand|recogniz/i.test(content))
    insights.push('Increased self-awareness and emotional insight');
  return insights;
}

export function extractGrowthAreas(content: string): string[] {
  const areas: string[] = [];
  if (/anxiety|worry|fear/i.test(content))
    areas.push('Anxiety management and emotional regulation');
  if (/relationship|communication/i.test(content))
    areas.push('Interpersonal skills and relationship dynamics');
  if (/self.*esteem|confidence|worth/i.test(content)) areas.push('Self-esteem and self-acceptance');
  return areas;
}

export function extractClientStrengths(content: string): string[] {
  const strengths: string[] = [];
  if (/open|honest|willing|engag/i.test(content)) strengths.push('Openness to therapeutic process');
  if (/insight|aware|understand/i.test(content)) strengths.push('Self-reflective capacity');
  if (/motiv|commit|effort/i.test(content)) strengths.push('Motivation for change');
  if (/support|friend|family/i.test(content)) strengths.push('Social support network');
  return strengths;
}

export function extractIdentifiedPatterns(content: string): string[] {
  const patterns: string[] = [];
  if (/pattern|recurring|repeat/i.test(content))
    patterns.push('Recurring thought and behavior patterns identified');
  if (/trigger|situation|when/i.test(content))
    patterns.push('Environmental and situational triggers recognized');
  return patterns;
}

export function extractActionItems(content: string): string[] {
  const actions: string[] = [];
  if (/practice|exercise|homework/i.test(content))
    actions.push('Complete therapeutic exercises between sessions');
  if (/journal|write|record/i.test(content))
    actions.push('Maintain therapeutic journaling practice');
  if (/mindful|meditat/i.test(content))
    actions.push('Incorporate mindfulness practices into daily routine');
  return actions;
}

export function extractMoodAssessment(content: string): string {
  if (/severe|crisis|high.*distress/i.test(content))
    return 'High distress levels requiring immediate attention';
  if (/moderate|some.*difficulty/i.test(content))
    return 'Moderate mood challenges with therapeutic potential';
  if (/stable|improving|positive/i.test(content))
    return 'Stable mood with positive therapeutic indicators';
  return 'Mood assessment extracted from session content';
}

export function extractTherapeuticFrameworks(content: string): unknown[] {
  const frameworks: unknown[] = [];
  if (/cbt|cognitive.*behav|thought.*record|automatic.*thought/i.test(content)) {
    frameworks.push({
      name: 'CBT',
      applicability: 'high',
      specificTechniques: ['Thought record work', 'Cognitive restructuring'],
      priority: 4,
    });
  }
  if (/schema|mode|early.*maladaptiv/i.test(content)) {
    frameworks.push({
      name: 'Schema Therapy',
      applicability: 'high',
      specificTechniques: ['Mode work', 'Schema exploration'],
      priority: 3,
    });
  }
  if (/mindful|meditat|present.*moment|acceptance/i.test(content)) {
    frameworks.push({
      name: 'Mindfulness-Based Therapy',
      applicability: 'medium',
      specificTechniques: ['Mindfulness exercises', 'Present-moment awareness'],
      priority: 2,
    });
  }
  if (/exposure|gradual|hierarchy|systematic/i.test(content)) {
    frameworks.push({
      name: 'Exposure Therapy',
      applicability: 'medium',
      specificTechniques: ['Gradual exposure', 'Response prevention'],
      priority: 3,
    });
  }
  return frameworks;
}
