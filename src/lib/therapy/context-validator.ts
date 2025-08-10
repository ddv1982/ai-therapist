/**
 * Contextual Validation System for Cognitive Distortion Analysis
 * 
 * Provides robust validation to reduce false positives in therapeutic pattern detection
 * by assessing emotional context and therapeutic relevance.
 */

export interface ContextualAnalysis {
  emotionalIntensity: number;         // 0-10 scale of emotional distress
  therapeuticRelevance: number;       // 0-10 scale of mental health relevance
  neutralContextFlags: string[];     // Detected neutral contexts
  stressIndicators: string[];         // Phrases indicating emotional distress
  contextType: 'therapeutic' | 'neutral' | 'organizational' | 'ambiguous';
  confidence: number;                 // 0-100 confidence in context classification
}

export interface ValidationResult {
  isValidTherapeuticContext: boolean;
  contextualAnalysis: ContextualAnalysis;
  confidenceAdjustment: number;       // Multiplier for distortion confidence (0-1.5)
  exclusionReason?: string;           // Reason if excluded from analysis
}

// High-strength emotional distress patterns (3 points each)
const HIGH_STRENGTH_DISTRESS_PATTERNS = [
  // Direct emotional expressions with strong intensity
  /I feel (extremely|incredibly|overwhelmingly|completely|totally|absolutely)\s?(scared|terrified|anxious|worried|depressed|sad|hopeless|worthless|ashamed|guilty|devastated|heartbroken)/i,
  
  // Direct terror/panic statements
  /I'm (terrified|petrified|panicking)/i,
  
  // Strong self-critical language
  /(I'm such a|I feel like such a)\s?(failure|idiot|loser|disappointment|burden|mess|fraud)/i,
  /(complete|total|absolute|utter)\s?(failure|disaster|mess|loser)/i,
  
  // Catastrophic emotional language
  /(everything (is|feels)|my life is|I'm completely|this is) (falling apart|ruined|hopeless|pointless|a disaster|over)/i,
  /(everything.*worthless|everything.*garbage|everything.*terrible)/i,
  
  // Fear-based distress about judgment  
  /(I'm terrified|I'm petrified|I panic)\s?(that|about|of|everyone)/i,
  
  // Strong interpersonal anxiety with emotional weight
  /(everyone (thinks|knows|sees)|I'm sure (they|people))\s?.*(I'm (bad|wrong|stupid|incompetent|worthless|a failure))/i,
  
  // Strong emotional reasoning with distress
  /(I feel like|I can't shake the feeling)\s?(everything|everyone|nothing|nobody).*(falling apart|against me|hopeless|ruined)/i,
];

// Medium-strength emotional distress patterns (2 points each)  
const MEDIUM_STRENGTH_DISTRESS_PATTERNS = [
  // Direct emotional expressions
  /I feel (so|really)?\s?(scared|terrified|anxious|worried|depressed|sad|hopeless|worthless|ashamed|guilty|angry|furious)/i,
  
  // Intensity amplifiers with emotions
  /I'm (so|really|completely|totally)\s?(worried|scared|anxious|sad|depressed|angry|frustrated|overwhelmed)/i,
  
  // Distress about consequences
  /(I'm afraid|I'm worried|I'm scared)\s?(that|about|of)/i,
  
  // Therapeutic language with self-criticism
  /(I always|I never)\s.*(mess up|fail|screw up|ruin|disappoint|hurt)/i,
  
  // Emotional distress with "always/never" patterns
  /(I'm worried|I'm scared|I feel like)\s.*(I always|I never|everyone|everything)/i,
  
  // Struggling/dealing with issues
  /(I'm|I've been) (really )?struggling with/i,
  /(I'm|I've been) dealing with.*(anxiety|depression|stress|worry)/i,
  
  // Fear of judgment and exposure  
  /(everyone will see|everyone will think|everyone will know)\s.*(how|that I'm|I'm)\s.*(incompetent|stupid|worthless|a failure|bad|inadequate)/i,
  
  // Relationship and connection anxiety
  /(I'll never find|nobody will ever|no one will ever)\s.*(love|care|understand|accept)/i,
];

// Low-strength distress patterns (1 point each)
const LOW_STRENGTH_DISTRESS_PATTERNS = [
  // Spiraling and overwhelm patterns
  /spiraling into/i,
  /(feeling|I feel) (really |so |quite )?overwhelmed/i,
  
  // Sleep and focus impacts
  /(losing|I've lost) sleep (over|because)/i,
  /(affecting|impacting) my (focus|concentration|ability)/i,
  
  // Trapped in thoughts/feelings
  /(trapped|stuck) in.*(thoughts|feelings)/i,
  /can't find a way out/i,
  
  // Work and situational stress
  /(had|having) (some |a bit of |a lot of )?stress/i,
  /wondering if I handled.*correctly/i,
  /meeting didn't go.*planned/i,
  
  // Self-doubt and reflection
  /(wondering|questioning) (if|whether) I/i,
  /(doubting|questioning) myself/i,
  
  // Worry-based patterns  
  /(starting to worry|I'm worried|I worry)\s?(that|about)/i,
];

// Combined array for backward compatibility
const EMOTIONAL_DISTRESS_PATTERNS = [
  ...HIGH_STRENGTH_DISTRESS_PATTERNS,
  ...MEDIUM_STRENGTH_DISTRESS_PATTERNS, 
  ...LOW_STRENGTH_DISTRESS_PATTERNS
];

// Patterns indicating neutral, non-therapeutic contexts
const NEUTRAL_CONTEXT_PATTERNS = [
  // Routine and habitual descriptions - stronger patterns
  /I (always|usually|typically|generally|normally|regularly)\s?(take|go|do|work|eat|sleep|wake up|leave|arrive)\s?(the|to|at|for)/i,
  
  // Factual observations without emotional weight
  /(everyone at the|all the people|everybody in the)\s?(meeting|conference|event|party|class|office)/i,
  
  // Objective statements about functionality
  /(this|that|it)\s?(never|always|usually)\s?(works|functions|operates|runs|performs)/i,
  
  // Professional or academic contexts
  /(everyone|we should|they never)\s?(follow|use|implement|apply|consider|review|analyze|evaluate)/i,
  
  // Neutral daily routine descriptions
  /(daily routine|everyone knows)/i,
  /(it's my|that's my)\s?(routine|habit|way|approach)/i,
];

// Strong emotional amplifiers that increase therapeutic relevance
const EMOTIONAL_AMPLIFIERS = [
  /I'm (panicking|devastated|heartbroken|crushed|shattered|breaking down)/i,
  /(I can't (cope|handle|take)|this is (killing|destroying) me)/i,
  /(I feel like I'm (drowning|suffocating|falling apart|losing it))/i,
  /(my heart is|I'm so (hurt|broken|lost|confused|overwhelmed))/i,
];

// Context exclusion patterns for organizational/routine contexts
const EXCLUSION_PATTERNS = [
  // Work/professional organizing (only when no emotional distress words)
  /(organize|coordinate|plan|handle|manage)\s.*(everything|all)\s.*(for|at)\s.*(project|meeting|presentation|deadline|work|office|team)/i,
  
  // Event planning - more comprehensive  
  /(party|event|wedding|celebration|conference|gathering|birthday)\s.*(organize|coordinate|plan|handle|manage)\s.*(everything|all|details)/i,
  /(organize|organizing|plan|planning|coordinate|coordinating)\s.*(everything|all)\s.*(for|at)\s.*(party|event|wedding|celebration|gathering)/i,
  
  // Routine descriptions
  /(commute|schedule|routine|habit|daily|weekly|monthly)\s.*(always|never|usually)/i,
  
  // Technical/procedural contexts - more specific to avoid factual observations
  /(we should|let's|I'll|I need to)\s?(implement|use|follow)\s.*(system|process|procedure|method|approach|technique)/i,
  
  // Family/social event coordination
  /(family|social|birthday|graduation)\s.*(party|event|gathering|celebration)\s.*(organize|plan|coordinate|handle)/i,
  
  // Professional planning contexts (only neutral ones)
  /(we should|let's|I'll|I need to)\s?(coordinate|organize|make sure|ensure)\s.*(all|everything)\s.*(details|project|team|requirements)/i,
  /(need to|have to|should)\s?(organize|coordinate|plan)\s.*(everything|all)\s.*(for|at)\s.*(tonight|event|party)/i,
];

/**
 * Analyzes the contextual and emotional characteristics of text content
 * to determine therapeutic relevance for cognitive distortion analysis
 */
export function analyzeTherapeuticContext(content: string): ContextualAnalysis {
  let emotionalIntensity = 0;
  let therapeuticRelevance = 0;
  const neutralContextFlags: string[] = [];
  const stressIndicators: string[] = [];
  
  // Check for emotional distress patterns with weighted scoring
  let distressMatches = 0;
  
  // High-strength patterns (3 points each)
  for (const pattern of HIGH_STRENGTH_DISTRESS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      distressMatches++;
      emotionalIntensity += 3; // High-strength distress patterns
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 3;
    }
  }
  
  // Medium-strength patterns (2 points each)
  for (const pattern of MEDIUM_STRENGTH_DISTRESS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      distressMatches++;
      emotionalIntensity += 2; // Medium-strength distress patterns
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 2;
    }
  }
  
  // Low-strength patterns (1 point each)  
  for (const pattern of LOW_STRENGTH_DISTRESS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      distressMatches++;
      emotionalIntensity += 1; // Low-strength distress patterns
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 1;
    }
  }
  
  // Check for emotional amplifiers
  for (const pattern of EMOTIONAL_AMPLIFIERS) {
    const matches = content.match(pattern);
    if (matches) {
      emotionalIntensity += 3; // Strong amplifiers add more intensity
      stressIndicators.push(matches[0].substring(0, 50));
      therapeuticRelevance += 3;
    }
  }
  
  // Check for neutral context patterns
  let neutralMatches = 0;
  for (const pattern of NEUTRAL_CONTEXT_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      neutralMatches++;
      neutralContextFlags.push('routine_factual');
      emotionalIntensity = Math.max(0, emotionalIntensity - 1); // Reduce intensity
    }
  }
  
  // Check for explicit exclusion patterns (stronger penalty)
  let organizationalMatches = 0;
  for (const pattern of EXCLUSION_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      organizationalMatches++;
      neutralContextFlags.push('organizational');
      emotionalIntensity = Math.max(0, emotionalIntensity - 3); // Strongly reduce intensity
      therapeuticRelevance = Math.max(0, therapeuticRelevance - 3);
    }
  }
  
  // Normalize scores to 0-10 scale
  emotionalIntensity = Math.min(10, emotionalIntensity);
  therapeuticRelevance = Math.min(10, therapeuticRelevance);
  
  // Determine context type with nuanced therapeutic priority logic
  let contextType: ContextualAnalysis['contextType'];
  
  // Strong therapeutic signals override any organizational context
  if (emotionalIntensity >= 5 && therapeuticRelevance >= 4 && distressMatches > 0) {
    contextType = 'therapeutic';
  }
  // Mixed context: has both organizational and emotional elements
  else if (organizationalMatches > 0 && distressMatches > 0) {
    contextType = 'ambiguous';
  }
  // Pure emotional distress without organizational elements
  else if (emotionalIntensity >= 3 && distressMatches > 0 && organizationalMatches === 0) {
    contextType = 'therapeutic';
  }
  // Pure organizational context only when NO emotional signals
  else if (organizationalMatches > 0 && emotionalIntensity === 0 && distressMatches === 0) {
    contextType = 'organizational';
  }
  // Neutral context for routine/factual with minimal emotion and no distress
  else if (neutralMatches > 0 && emotionalIntensity < 2 && distressMatches === 0) {
    contextType = 'neutral';
  }
  // Everything else is ambiguous
  else {
    contextType = 'ambiguous';
  }
  
  // Calculate confidence based on clarity of context signals
  let confidence = 50; // Base confidence
  if (distressMatches >= 2) confidence += 25; // Clear emotional distress
  if (neutralMatches >= 2) confidence += 20;   // Clear neutral context
  if (neutralContextFlags.length > 0 && distressMatches === 0) confidence += 25; // Clear neutral
  confidence = Math.min(100, confidence);
  
  return {
    emotionalIntensity,
    therapeuticRelevance,
    neutralContextFlags: Array.from(new Set(neutralContextFlags)), // Remove duplicates
    stressIndicators: Array.from(new Set(stressIndicators)),
    contextType,
    confidence
  };
}

/**
 * Validates whether content should be analyzed for cognitive distortions
 * based on therapeutic context and emotional relevance
 */
export function validateTherapeuticContext(content: string): ValidationResult {
  const contextualAnalysis = analyzeTherapeuticContext(content);
  
  // Determine if context is valid for therapeutic analysis with graduated thresholds
  const isValidTherapeuticContext = 
    contextualAnalysis.contextType === 'therapeutic' ||
    (contextualAnalysis.contextType === 'ambiguous' && 
     (contextualAnalysis.emotionalIntensity >= 1 || 
      contextualAnalysis.therapeuticRelevance >= 1));
  
  // Calculate confidence adjustment multiplier
  let confidenceAdjustment = 1.0;
  
  if (contextualAnalysis.contextType === 'therapeutic' && contextualAnalysis.emotionalIntensity >= 7) {
    confidenceAdjustment = 1.2; // Boost confidence for clear therapeutic context
  } else if (contextualAnalysis.contextType === 'neutral' || contextualAnalysis.contextType === 'organizational') {
    confidenceAdjustment = 0.3; // Severely reduce confidence for neutral contexts
  } else if (contextualAnalysis.contextType === 'ambiguous') {
    confidenceAdjustment = 0.7; // Moderate reduction for ambiguous contexts
  }
  
  // Determine exclusion reason if applicable
  let exclusionReason: string | undefined;
  if (!isValidTherapeuticContext) {
    if (contextualAnalysis.neutralContextFlags.includes('organizational')) {
      exclusionReason = 'Content appears in organizational/planning context without emotional distress';
    } else if (contextualAnalysis.neutralContextFlags.includes('routine_factual')) {
      exclusionReason = 'Content appears to be routine/factual description without therapeutic relevance';
    } else if (contextualAnalysis.emotionalIntensity < 3 && contextualAnalysis.therapeuticRelevance < 4) {
      exclusionReason = 'Insufficient emotional intensity or therapeutic relevance for analysis';
    }
  }
  
  return {
    isValidTherapeuticContext,
    contextualAnalysis,
    confidenceAdjustment,
    exclusionReason
  };
}

/**
 * Calculates enhanced confidence score for cognitive distortion analysis
 * incorporating contextual validation
 */
export function calculateContextualConfidence(
  baseConfidence: number,
  validationResult: ValidationResult,
  hasCBTAlignment: boolean = false
): number {
  let adjustedConfidence = baseConfidence * validationResult.confidenceAdjustment;
  
  // Additional adjustments based on context quality
  if (validationResult.contextualAnalysis.stressIndicators.length >= 2) {
    adjustedConfidence *= 1.1; // Multiple stress indicators boost confidence
  }
  
  if (hasCBTAlignment) {
    adjustedConfidence *= 1.15; // CBT diary data alignment boosts confidence
  }
  
  // Cap at reasonable confidence levels
  return Math.min(95, Math.max(5, adjustedConfidence));
}

/**
 * Generates human-readable explanation of contextual validation results
 */
export function getContextValidationExplanation(validationResult: ValidationResult): string {
  const { contextualAnalysis, isValidTherapeuticContext, exclusionReason } = validationResult;
  
  if (!isValidTherapeuticContext && exclusionReason) {
    return exclusionReason;
  }
  
  const parts: string[] = [];
  
  if (contextualAnalysis.contextType === 'therapeutic') {
    parts.push(`Strong therapeutic context (emotional intensity: ${contextualAnalysis.emotionalIntensity}/10)`);
  } else if (contextualAnalysis.contextType === 'ambiguous') {
    parts.push(`Ambiguous context requiring careful analysis (emotional intensity: ${contextualAnalysis.emotionalIntensity}/10)`);
  }
  
  if (contextualAnalysis.stressIndicators.length > 0) {
    parts.push(`${contextualAnalysis.stressIndicators.length} emotional distress indicator(s) detected`);
  }
  
  if (contextualAnalysis.neutralContextFlags.length > 0) {
    parts.push(`Neutral context flags: ${contextualAnalysis.neutralContextFlags.join(', ')}`);
  }
  
  return parts.join('; ') || 'Standard therapeutic analysis context';
}