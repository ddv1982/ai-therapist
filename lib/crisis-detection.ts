// Enhanced crisis detection system with context awareness

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: 'low' | 'medium' | 'high' | 'immediate';
  keywords: string[];
  confidence: number;
  suggestions: string[];
}

// Categorized crisis keywords with severity levels
export const CRISIS_KEYWORDS = {
  immediate: [
    'kill myself',
    'suicide',
    'end it all',
    'better off dead',
    'going to die',
    'plan to die',
    'suicide plan',
    'tonight is the night',
    'goodbye forever'
  ],
  high: [
    'not worth living',
    'wish I was dead',
    'want to disappear',
    'can\'t go on',
    'no point in living',
    'everyone would be better without me',
    'tired of living',
    'ready to give up'
  ],
  medium: [
    'hurt myself',
    'self-harm',
    'cutting',
    'burning myself',
    'overdose',
    'pills',
    'razor',
    'pain makes me feel better',
    'deserve to suffer'
  ],
  low: [
    'worthless',
    'hopeless',
    'useless',
    'failure',
    'empty inside',
    'numb',
    'lost',
    'broken',
    'can\'t cope',
    'overwhelming'
  ]
};

// Context phrases that might indicate crisis even without explicit keywords
export const CRISIS_CONTEXT_PATTERNS = [
  /can['\s]?t\s+(take|handle|deal)\s+it\s+anymore/i,
  /everything\s+is\s+(falling\s+apart|too\s+much)/i,
  /no\s+one\s+(cares|would\s+miss\s+me)/i,
  /nothing\s+(matters|helps|works)/i,
  /see\s+no\s+(way\s+out|point|future)/i,
  /ready\s+to\s+(give\s+up|quit|stop\s+trying)/i,
  /world\s+would\s+be\s+better\s+without\s+me/i,
  /just\s+want\s+(it\s+to\s+stop|the\s+pain\s+to\s+end)/i,
];

// Protective factors that might lower crisis risk
export const PROTECTIVE_FACTORS = [
  'family',
  'friends',
  'support',
  'therapy',
  'counseling',
  'help',
  'hope',
  'future',
  'goals',
  'dreams',
  'tomorrow',
  'getting better',
  'improving'
];

export function detectCrisis(message: string, conversationHistory: string[] = []): CrisisDetectionResult {
  const normalizedMessage = message.toLowerCase().trim();
  const foundKeywords: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' | 'immediate' = 'low';
  let totalScore = 0;

  // Check for explicit crisis keywords
  Object.entries(CRISIS_KEYWORDS).forEach(([severity, keywords]) => {
    keywords.forEach(keyword => {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        maxSeverity = getHigherSeverity(maxSeverity, severity as any);
        
        // Add weighted scores based on severity
        switch (severity) {
          case 'immediate': totalScore += 10; break;
          case 'high': totalScore += 7; break;
          case 'medium': totalScore += 4; break;
          case 'low': totalScore += 2; break;
        }
      }
    });
  });

  // Check for contextual crisis patterns
  CRISIS_CONTEXT_PATTERNS.forEach(pattern => {
    if (pattern.test(normalizedMessage)) {
      foundKeywords.push('contextual_crisis_pattern');
      maxSeverity = getHigherSeverity(maxSeverity, 'medium');
      totalScore += 5;
    }
  });

  // Check for protective factors (reduces crisis score)
  let protectiveFactorCount = 0;
  PROTECTIVE_FACTORS.forEach(factor => {
    if (normalizedMessage.includes(factor)) {
      protectiveFactorCount++;
    }
  });

  // Reduce score based on protective factors
  totalScore = Math.max(0, totalScore - (protectiveFactorCount * 1.5));

  // Consider conversation history for escalation patterns
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-3).join(' ').toLowerCase();
    const historyScore = CRISIS_KEYWORDS.immediate.some(keyword => 
      recentMessages.includes(keyword.toLowerCase())
    ) ? 3 : 0;
    totalScore += historyScore;
  }

  // Calculate confidence based on explicitness and context
  const confidence = Math.min(100, Math.max(10, 
    (foundKeywords.length * 20) + 
    (maxSeverity === 'immediate' ? 40 : 0) +
    (maxSeverity === 'high' ? 25 : 0)
  ));

  // Determine if this constitutes a crisis
  const isCrisis = totalScore >= 4 || maxSeverity === 'immediate' || maxSeverity === 'high';

  // Update severity based on total score
  if (totalScore >= 10 || maxSeverity === 'immediate') {
    maxSeverity = 'immediate';
  } else if (totalScore >= 7 || maxSeverity === 'high') {
    maxSeverity = 'high';
  } else if (totalScore >= 4 || maxSeverity === 'medium') {
    maxSeverity = 'medium';
  }

  return {
    isCrisis,
    severity: maxSeverity,
    keywords: foundKeywords,
    confidence,
    suggestions: generateSuggestions(maxSeverity, foundKeywords)
  };
}

function getHigherSeverity(
  current: 'low' | 'medium' | 'high' | 'immediate',
  new_severity: 'low' | 'medium' | 'high' | 'immediate'
): 'low' | 'medium' | 'high' | 'immediate' {
  const severityOrder = { low: 1, medium: 2, high: 3, immediate: 4 };
  return severityOrder[new_severity] > severityOrder[current] ? new_severity : current;
}

function generateSuggestions(severity: string, keywords: string[]): string[] {
  const suggestions = [];

  if (severity === 'immediate') {
    suggestions.push('Immediate professional intervention required');
    suggestions.push('Contact emergency services (911)');
    suggestions.push('Crisis hotline: 988');
  } else if (severity === 'high') {
    suggestions.push('Urgent professional support recommended');
    suggestions.push('Crisis text line: Text HOME to 741741');
    suggestions.push('Contact trusted friend or family member');
  } else if (severity === 'medium') {
    suggestions.push('Professional support recommended');
    suggestions.push('Consider contacting therapist or counselor');
    suggestions.push('Reach out to support network');
  } else {
    suggestions.push('Continue monitoring conversation');
    suggestions.push('Provide emotional support and validation');
    suggestions.push('Encourage professional help if patterns persist');
  }

  // Add specific suggestions based on detected keywords
  if (keywords.some(k => k.includes('cutting') || k.includes('self-harm'))) {
    suggestions.push('Self-harm resources: selfinjury.org');
  }

  return suggestions;
}

export const CRISIS_RESPONSES = {
  immediate: `🚨 I'm very concerned about what you've shared. Your safety is the top priority right now.

IMMEDIATE HELP:
• Call 911 or go to your nearest emergency room
• National Suicide Prevention Lifeline: 988 (24/7)
• Crisis Text Line: Text HOME to 741741

You don't have to face this alone. Please reach out for help right now.`,

  high: `I'm deeply concerned about what you're going through. Your life has value and there are people who want to help.

URGENT RESOURCES:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• SAMHSA National Helpline: 1-800-662-4357

Please consider reaching out to a trusted friend, family member, or mental health professional today.`,

  medium: `I hear that you're struggling, and I want you to know that support is available.

HELPFUL RESOURCES:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Psychology Today therapist finder: psychologytoday.com

Would you like to talk about what's been making you feel this way?`,

  low: `I can hear that things feel difficult right now. These feelings are valid, and it's okay to not be okay.

Remember that support is always available if you need it:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741

What's been weighing on your mind lately?`
};