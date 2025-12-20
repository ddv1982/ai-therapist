/**
 * Therapeutic Validation & Crisis Detection
 * Combines contextual validation and crisis detection for safe therapeutic interactions
 */

// ========================================
// CONTEXTUAL VALIDATION SYSTEM
// ========================================

export interface ContextualAnalysis {
  emotionalIntensity: number;
  therapeuticRelevance: number;
  neutralContextFlags: string[];
  stressIndicators: string[];
  contextType: 'therapeutic' | 'neutral' | 'organizational' | 'ambiguous';
  confidence: number;
}

export interface ValidationResult {
  isValidTherapeuticContext: boolean;
  contextualAnalysis: ContextualAnalysis;
  confidenceAdjustment: number;
  exclusionReason?: string;
}

const HIGH_STRENGTH_DISTRESS_PATTERNS = [
  /I feel (extremely|incredibly|overwhelmingly|completely|totally|absolutely)\s?(scared|terrified|anxious|worried|depressed|sad|hopeless|worthless|ashamed|guilty|devastated|heartbroken)/i,
  /I'm (terrified|petrified|panicking)/i,
  /(I'm such a|I feel like such a)\s?(failure|idiot|loser|disappointment|burden|mess|fraud)/i,
  /(complete|total|absolute|utter)\s?(failure|disaster|mess|loser)/i,
  /(everything (is|feels)|my life is|I'm completely|this is) (falling apart|ruined|hopeless|pointless|a disaster|over)/i,
  /(everything.*worthless|everything.*garbage|everything.*terrible)/i,
  /(I'm terrified|I'm petrified|I panic)\s?(that|about|of|everyone)/i,
  /(everyone (thinks|knows|sees)|I'm sure (they|people))\s?.*(I'm (bad|wrong|stupid|incompetent|worthless|a failure))/i,
  /(I feel like|I can't shake the feeling)\s?(everything|everyone|nothing|nobody).*(falling apart|against me|hopeless|ruined)/i,
];

const MEDIUM_STRENGTH_DISTRESS_PATTERNS = [
  /I feel (so|really)?\s?(scared|terrified|anxious|worried|depressed|sad|hopeless|worthless|ashamed|guilty|angry|furious)/i,
  /I'm (so|really|completely|totally)\s?(worried|scared|anxious|sad|depressed|angry|frustrated|overwhelmed)/i,
  /(I'm afraid|I'm worried|I'm scared)\s?(that|about|of)/i,
  /(I always|I never)\s.*(mess up|fail|screw up|ruin|disappoint|hurt)/i,
  /(I'm worried|I'm scared|I feel like)\s.*(I always|I never|everyone|everything)/i,
  /(I'm|I've been) (really )?struggling with/i,
  /(I'm|I've been) dealing with.*(anxiety|depression|stress|worry)/i,
  /(everyone will see|everyone will think|everyone will know)\s.*(how|that I'm|I'm)\s.*(incompetent|stupid|worthless|a failure|bad|inadequate)/i,
  /(I'll never find|nobody will ever|no one will ever)\s.*(love|care|understand|accept)/i,
];

const LOW_STRENGTH_DISTRESS_PATTERNS = [
  /spiraling into/i,
  /(feeling|I feel) (really |so |quite )?overwhelmed/i,
  /(losing|I've lost) sleep (over|because)/i,
  /(affecting|impacting) my (focus|concentration|ability)/i,
  /(trapped|stuck) in.*(thoughts|feelings)/i,
  /can't find a way out/i,
  /(had|having) (some |a bit of |a lot of )?stress/i,
  /wondering if I handled.*correctly/i,
  /meeting didn't go.*planned/i,
  /(wondering|questioning) (if|whether) I/i,
  /(doubting|questioning) myself/i,
  /(starting to worry|I'm worried|I worry)\s?(that|about)/i,
];

const NEUTRAL_CONTEXT_PATTERNS = [
  /I (always|usually|typically|generally|normally|regularly)\s?(take|go|do|work|eat|sleep|wake up|leave|arrive)\s?(the|to|at|for)/i,
  /(everyone at the|all the people|everybody in the)\s?(meeting|conference|event|party|class|office)/i,
  /(this|that|it)\s?(never|always|usually)\s?(works|functions|operates|runs|performs)/i,
  /(everyone|we should|they never)\s?(follow|use|implement|apply|consider|review|analyze|evaluate)/i,
  /(daily routine|everyone knows)/i,
  /(it's my|that's my)\s?(routine|habit|way|approach)/i,
];

const EMOTIONAL_AMPLIFIERS = [
  /I'm (panicking|devastated|heartbroken|crushed|shattered|breaking down)/i,
  /(I can't (cope|handle|take)|this is (killing|destroying) me)/i,
  /(I feel like I'm (drowning|suffocating|falling apart|losing it))/i,
  /(my heart is|I'm so (hurt|broken|lost|confused|overwhelmed))/i,
];

const EXCLUSION_PATTERNS = [
  /(organize|coordinate|plan|handle|manage)\s.*(everything|all)\s.*(for|at)\s.*(project|meeting|presentation|deadline|work|office|team)/i,
  /(party|event|wedding|celebration|conference|gathering|birthday)\s.*(organize|coordinate|plan|handle|manage)\s.*(everything|all|details)/i,
  /(organize|organizing|plan|planning|coordinate|coordinating)\s.*(everything|all)\s.*(for|at)\s.*(party|event|wedding|celebration|gathering)/i,
  /(commute|schedule|routine|habit|daily|weekly|monthly)\s.*(always|never|usually)/i,
  /(we should|let's|I'll|I need to)\s?(implement|use|follow)\s.*(system|process|procedure|method|approach|technique)/i,
  /(family|social|birthday|graduation)\s.*(party|event|gathering|celebration)\s.*(organize|plan|coordinate|handle)/i,
  /(we should|let's|I'll|I need to)\s?(coordinate|organize|make sure|ensure)\s.*(all|everything)\s.*(details|project|team|requirements)/i,
  /(need to|have to|should)\s?(organize|coordinate|plan)\s.*(everything|all)\s.*(for|at)\s.*(tonight|event|party)/i,
];

export function analyzeTherapeuticContext(content: string): ContextualAnalysis {
  let emotionalIntensity = 0;
  let therapeuticRelevance = 0;
  const neutralContextFlags: string[] = [];
  const stressIndicators: string[] = [];
  let distressMatches = 0;

  for (const pattern of HIGH_STRENGTH_DISTRESS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      distressMatches++;
      emotionalIntensity += 3;
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 3;
    }
  }

  for (const pattern of MEDIUM_STRENGTH_DISTRESS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      distressMatches++;
      emotionalIntensity += 2;
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 2;
    }
  }

  for (const pattern of LOW_STRENGTH_DISTRESS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      distressMatches++;
      emotionalIntensity += 1;
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 1;
    }
  }

  for (const pattern of EMOTIONAL_AMPLIFIERS) {
    const matches = content.match(pattern);
    if (matches) {
      emotionalIntensity += 3;
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 3;
    }
  }

  let neutralMatches = 0;
  for (const pattern of NEUTRAL_CONTEXT_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      neutralMatches++;
      neutralContextFlags.push('routine_factual');
      emotionalIntensity = Math.max(0, emotionalIntensity - 1);
    }
  }

  let organizationalMatches = 0;
  for (const pattern of EXCLUSION_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      organizationalMatches++;
      neutralContextFlags.push('organizational');
      emotionalIntensity = Math.max(0, emotionalIntensity - 3);
      therapeuticRelevance = Math.max(0, therapeuticRelevance - 3);
    }
  }

  emotionalIntensity = Math.min(10, emotionalIntensity);
  therapeuticRelevance = Math.min(10, therapeuticRelevance);

  let contextType: ContextualAnalysis['contextType'];

  if (emotionalIntensity >= 3 && therapeuticRelevance >= 2 && distressMatches > 0) {
    contextType = 'therapeutic';
  } else if (emotionalIntensity >= 2 && distressMatches > 0) {
    contextType = 'therapeutic';
  } else if (organizationalMatches > 0 && distressMatches > 0) {
    contextType = emotionalIntensity >= 1 ? 'therapeutic' : 'ambiguous';
  } else if (emotionalIntensity >= 1 && distressMatches > 0 && organizationalMatches === 0) {
    contextType = 'therapeutic';
  } else if (
    organizationalMatches > 0 &&
    emotionalIntensity === 0 &&
    distressMatches === 0 &&
    therapeuticRelevance === 0
  ) {
    contextType = 'organizational';
  } else if (
    neutralMatches > 0 &&
    emotionalIntensity === 0 &&
    distressMatches === 0 &&
    therapeuticRelevance === 0
  ) {
    contextType = 'neutral';
  } else {
    contextType = 'ambiguous';
  }

  let confidence = 50;
  if (distressMatches >= 2) confidence += 25;
  if (neutralMatches >= 2) confidence += 20;
  if (neutralContextFlags.length > 0 && distressMatches === 0) confidence += 25;
  confidence = Math.min(100, confidence);

  return {
    emotionalIntensity,
    therapeuticRelevance,
    neutralContextFlags: Array.from(new Set(neutralContextFlags)),
    stressIndicators: Array.from(new Set(stressIndicators)),
    contextType,
    confidence,
  };
}

export function validateTherapeuticContext(content: string): ValidationResult {
  const contextualAnalysis = analyzeTherapeuticContext(content);

  const isValidTherapeuticContext =
    contextualAnalysis.contextType === 'therapeutic' ||
    (contextualAnalysis.contextType === 'ambiguous' &&
      (contextualAnalysis.emotionalIntensity >= 1 ||
        contextualAnalysis.therapeuticRelevance >= 1)) ||
    contextualAnalysis.stressIndicators.length > 0 ||
    /therapy|counseling|mental.*health|feeling|emotion|anxiety|depression|stress|cope|support/i.test(
      content
    );

  let confidenceAdjustment = 1.0;

  if (
    contextualAnalysis.contextType === 'therapeutic' &&
    contextualAnalysis.emotionalIntensity >= 6
  ) {
    confidenceAdjustment = 1.3;
  } else if (
    contextualAnalysis.contextType === 'therapeutic' &&
    contextualAnalysis.emotionalIntensity >= 3
  ) {
    confidenceAdjustment = 1.1;
  } else if (
    contextualAnalysis.contextType === 'neutral' &&
    contextualAnalysis.stressIndicators.length === 0
  ) {
    confidenceAdjustment = 0.5;
  } else if (
    contextualAnalysis.contextType === 'organizational' &&
    contextualAnalysis.emotionalIntensity === 0
  ) {
    confidenceAdjustment = 0.4;
  } else if (contextualAnalysis.contextType === 'ambiguous') {
    confidenceAdjustment = 0.8;
  }

  let exclusionReason: string | undefined;
  if (!isValidTherapeuticContext) {
    if (
      contextualAnalysis.neutralContextFlags.includes('organizational') &&
      contextualAnalysis.emotionalIntensity === 0 &&
      contextualAnalysis.stressIndicators.length === 0
    ) {
      exclusionReason = 'Pure organizational/planning context with no emotional content';
    } else if (
      contextualAnalysis.neutralContextFlags.includes('routine_factual') &&
      contextualAnalysis.emotionalIntensity === 0 &&
      contextualAnalysis.therapeuticRelevance === 0
    ) {
      exclusionReason = 'Pure routine/factual description with no therapeutic indicators';
    } else if (
      contextualAnalysis.emotionalIntensity === 0 &&
      contextualAnalysis.therapeuticRelevance === 0 &&
      contextualAnalysis.stressIndicators.length === 0
    ) {
      exclusionReason = 'No emotional or therapeutic indicators detected';
    }
  }

  return {
    isValidTherapeuticContext,
    contextualAnalysis,
    confidenceAdjustment,
    exclusionReason,
  };
}

export function calculateContextualConfidence(
  baseConfidence: number,
  validationResult: ValidationResult,
  hasCBTAlignment: boolean = false
): number {
  let adjustedConfidence = baseConfidence * validationResult.confidenceAdjustment;

  if (validationResult.contextualAnalysis.stressIndicators.length >= 2) {
    adjustedConfidence *= 1.1;
  }

  if (hasCBTAlignment) {
    adjustedConfidence *= 1.15;
  }

  return Math.min(95, Math.max(5, adjustedConfidence));
}

export function getContextValidationExplanation(validationResult: ValidationResult): string {
  const { contextualAnalysis, isValidTherapeuticContext, exclusionReason } = validationResult;

  if (!isValidTherapeuticContext && exclusionReason) {
    return exclusionReason;
  }

  const parts: string[] = [];

  if (contextualAnalysis.contextType === 'therapeutic') {
    parts.push(
      `Strong therapeutic context (emotional intensity: ${contextualAnalysis.emotionalIntensity}/10)`
    );
  } else if (contextualAnalysis.contextType === 'ambiguous') {
    parts.push(
      `Ambiguous context requiring careful analysis (emotional intensity: ${contextualAnalysis.emotionalIntensity}/10)`
    );
  }

  if (contextualAnalysis.stressIndicators.length > 0) {
    parts.push(
      `${contextualAnalysis.stressIndicators.length} emotional distress indicator(s) detected`
    );
  }

  if (contextualAnalysis.neutralContextFlags.length > 0) {
    parts.push(`Neutral context flags: ${contextualAnalysis.neutralContextFlags.join(', ')}`);
  }

  return parts.join('; ') || 'Standard therapeutic analysis context';
}

// ========================================
// CRISIS DETECTION SYSTEM
// ========================================

export interface CrisisDetectionResult {
  isHighRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  triggeredKeywords: string[];
  detectedCategories: CrisisCategory[];
  recommendedActions: string[];
  emergencyResources: EmergencyResource[];
}

export interface CrisisCategory {
  category:
    | 'suicide'
    | 'self_harm'
    | 'severe_depression'
    | 'substance_abuse'
    | 'trauma'
    | 'psychosis';
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
}

export interface EmergencyResource {
  name: string;
  phone: string;
  website?: string;
  description: string;
  available24x7: boolean;
}

const CRISIS_KEYWORDS = {
  suicide: {
    high: [
      'kill myself',
      'end my life',
      "don't want to live",
      'want to die',
      'suicide plan',
      'no point living',
      'better off dead',
      'end it all',
      'take my own life',
      'not worth living',
    ],
    medium: [
      'suicidal',
      'suicide',
      'end my pain',
      "can't go on",
      'give up',
      'no hope',
      'pointless',
      'worthless',
      'escape this pain',
    ],
    low: ['wish I was dead', 'disappear', 'fade away', 'not here anymore'],
  },
  self_harm: {
    high: [
      'cut myself',
      'hurt myself',
      'self harm',
      'cutting',
      'burning myself',
      'scratching',
      'hitting myself',
      'punish myself',
    ],
    medium: [
      'self-harm',
      'harm myself',
      'pain to cope',
      'deserve pain',
      'need to hurt',
      'release through pain',
    ],
    low: ['picking at', 'scratching until', 'bite myself'],
  },
  severe_depression: {
    high: [
      'completely hopeless',
      'nothing matters',
      "can't function",
      "can't get out of bed",
      'lost all motivation',
      'everything is pointless',
    ],
    medium: [
      'severely depressed',
      'major depression',
      'deep depression',
      'overwhelming sadness',
      'can barely cope',
      'losing myself',
    ],
    low: ['very depressed', 'really down', 'feeling empty', 'numb inside'],
  },
  substance_abuse: {
    high: [
      "can't stop drinking",
      'addicted to',
      'overdose',
      'too much alcohol',
      'drug problem',
      'substance abuse',
      'drinking to cope',
    ],
    medium: [
      'drinking heavily',
      'using drugs',
      'self-medicating',
      'alcohol dependency',
      'substance use',
    ],
    low: ['drinking more', 'using substances', 'numbing with'],
  },
  trauma: {
    high: [
      'flashbacks',
      'reliving trauma',
      'panic attacks',
      "can't escape memories",
      'traumatic memories',
      'ptsd symptoms',
      'triggered constantly',
    ],
    medium: [
      'trauma response',
      'traumatic event',
      'dissociating',
      'nightmares',
      'hypervigilant',
      'emotional numbness',
    ],
    low: ['traumatic', 'painful memories', 'triggered', 'upset memories'],
  },
  psychosis: {
    high: [
      'hearing voices',
      'seeing things',
      'not real',
      'paranoid',
      'being watched',
      'conspiracy',
      'voices telling me',
    ],
    medium: [
      'hallucinations',
      'delusions',
      'losing touch with reality',
      "can't trust thoughts",
      'confused about reality',
    ],
    low: ['strange thoughts', 'weird experiences', 'unusual perceptions'],
  },
};

const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    website: 'https://suicidepreventionlifeline.org/',
    description:
      'Free and confidential emotional support for people in suicidal crisis or emotional distress',
    available24x7: true,
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    website: 'https://www.crisistextline.org/',
    description: 'Free, 24/7 support for those in crisis via text message',
    available24x7: true,
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    description:
      'Treatment referral and information service for mental health and substance use disorders',
    available24x7: true,
  },
  {
    name: 'Emergency Services',
    phone: '911',
    description: 'For immediate medical emergencies or if you are in immediate danger',
    available24x7: true,
  },
];

export function detectCrisisContent(text: string): CrisisDetectionResult {
  const normalizedText = text.toLowerCase().trim();
  const triggeredKeywords: string[] = [];
  const detectedCategories: CrisisCategory[] = [];

  let highestRiskLevel: 'low' | 'medium' | 'high' | 'crisis' = 'low';
  let isHighRisk = false;

  Object.entries(CRISIS_KEYWORDS).forEach(([categoryName, severityLevels]) => {
    const category = categoryName as keyof typeof CRISIS_KEYWORDS;
    const categoryKeywords: string[] = [];
    let categorySeverity: 'low' | 'medium' | 'high' = 'low';

    Object.entries(severityLevels).forEach(([severity, keywords]) => {
      keywords.forEach((keyword) => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          triggeredKeywords.push(keyword);
          categoryKeywords.push(keyword);
          categorySeverity = severity as 'low' | 'medium' | 'high';

          if (severity === 'high') {
            highestRiskLevel = 'crisis';
            isHighRisk = true;
          } else if (severity === 'medium' && highestRiskLevel !== 'crisis') {
            highestRiskLevel = 'high';
            isHighRisk = true;
          } else if (severity === 'low' && highestRiskLevel === 'low') {
            highestRiskLevel = 'medium';
          }
        }
      });
    });

    if (categoryKeywords.length > 0) {
      detectedCategories.push({
        category,
        severity: categorySeverity,
        keywords: categoryKeywords,
      });
    }
  });

  const recommendedActions = generateRecommendedActions(detectedCategories, highestRiskLevel);
  const relevantResources = getRelevantResources();

  return {
    isHighRisk,
    riskLevel: highestRiskLevel,
    triggeredKeywords,
    detectedCategories,
    recommendedActions,
    emergencyResources: relevantResources,
  };
}

function generateRecommendedActions(
  categories: CrisisCategory[],
  riskLevel: 'low' | 'medium' | 'high' | 'crisis'
): string[] {
  const actions: string[] = [];

  if (riskLevel === 'crisis') {
    actions.push('Seek immediate professional help or contact emergency services');
    actions.push('Reach out to a trusted friend, family member, or mental health professional');
    actions.push('Remove any means of self-harm from your immediate environment');
    actions.push('Create a safety plan with specific coping strategies');
  } else if (riskLevel === 'high') {
    actions.push('Consider contacting a mental health professional within 24-48 hours');
    actions.push('Reach out to your support network (friends, family, therapist)');
    actions.push("Use healthy coping strategies you've learned");
    actions.push('Monitor your thoughts and feelings closely');
  } else if (riskLevel === 'medium') {
    actions.push('Schedule an appointment with a mental health professional');
    actions.push('Practice self-care and stress management techniques');
    actions.push('Connect with supportive people in your life');
    actions.push('Continue with your CBT exercises and coping strategies');
  }

  categories.forEach((category) => {
    switch (category.category) {
      case 'suicide':
        if (!actions.includes('Create a safety plan with specific coping strategies')) {
          actions.push('Consider creating a safety plan with crisis resources');
        }
        break;
      case 'substance_abuse':
        actions.push('Consider reaching out to substance abuse support resources');
        break;
      case 'trauma':
        actions.push('Practice grounding techniques and trauma-informed coping strategies');
        break;
      case 'self_harm':
        actions.push('Use alternative coping strategies instead of self-harm');
        break;
    }
  });

  return actions;
}

function getRelevantResources(): EmergencyResource[] {
  return [...EMERGENCY_RESOURCES];
}

export function requiresImmediateIntervention(result: CrisisDetectionResult): boolean {
  return (
    result.riskLevel === 'crisis' ||
    (result.isHighRisk &&
      result.detectedCategories.some(
        (cat) => cat.category === 'suicide' && cat.severity === 'high'
      ))
  );
}

export function generateCrisisAlert(result: CrisisDetectionResult): string {
  if (!result.isHighRisk) return '';

  const categoryNames = result.detectedCategories
    .map((cat) => cat.category.replace('_', ' '))
    .join(', ');

  let alertLevel = '';
  switch (result.riskLevel) {
    case 'crisis':
      alertLevel = '🚨 CRISIS ALERT';
      break;
    case 'high':
      alertLevel = '⚠️ HIGH RISK DETECTED';
      break;
    case 'medium':
      alertLevel = '⚡ MODERATE CONCERN';
      break;
  }

  return `${alertLevel}: Detected indicators related to ${categoryNames}. Please review the recommended actions and resources below.`;
}
