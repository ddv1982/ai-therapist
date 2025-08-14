/**
 * Crisis Detection System for CBT Diary Entries
 * 
 * This module provides keyword-based detection of concerning content
 * that may require immediate intervention or additional resources.
 */

export interface CrisisDetectionResult {
  isHighRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  triggeredKeywords: string[];
  detectedCategories: CrisisCategory[];
  recommendedActions: string[];
  emergencyResources: EmergencyResource[];
}

export interface CrisisCategory {
  category: 'suicide' | 'self_harm' | 'severe_depression' | 'substance_abuse' | 'trauma' | 'psychosis';
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

// Crisis keyword patterns organized by severity and category
const CRISIS_KEYWORDS = {
  suicide: {
    high: [
      'kill myself', 'end my life', 'don\'t want to live', 'want to die', 
      'suicide plan', 'no point living', 'better off dead', 'end it all',
      'take my own life', 'not worth living'
    ],
    medium: [
      'suicidal', 'suicide', 'end my pain', 'can\'t go on', 'give up',
      'no hope', 'pointless', 'worthless', 'escape this pain'
    ],
    low: [
      'wish I was dead', 'disappear', 'fade away', 'not here anymore'
    ]
  },
  self_harm: {
    high: [
      'cut myself', 'hurt myself', 'self harm', 'cutting', 'burning myself',
      'scratching', 'hitting myself', 'punish myself'
    ],
    medium: [
      'self-harm', 'harm myself', 'pain to cope', 'deserve pain',
      'need to hurt', 'release through pain'
    ],
    low: [
      'picking at', 'scratching until', 'bite myself'
    ]
  },
  severe_depression: {
    high: [
      'completely hopeless', 'nothing matters', 'can\'t function',
      'can\'t get out of bed', 'lost all motivation', 'everything is pointless'
    ],
    medium: [
      'severely depressed', 'major depression', 'deep depression',
      'overwhelming sadness', 'can barely cope', 'losing myself'
    ],
    low: [
      'very depressed', 'really down', 'feeling empty', 'numb inside'
    ]
  },
  substance_abuse: {
    high: [
      'can\'t stop drinking', 'addicted to', 'overdose', 'too much alcohol',
      'drug problem', 'substance abuse', 'drinking to cope'
    ],
    medium: [
      'drinking heavily', 'using drugs', 'self-medicating',
      'alcohol dependency', 'substance use'
    ],
    low: [
      'drinking more', 'using substances', 'numbing with'
    ]
  },
  trauma: {
    high: [
      'flashbacks', 'reliving trauma', 'panic attacks', 'can\'t escape memories',
      'traumatic memories', 'ptsd symptoms', 'triggered constantly'
    ],
    medium: [
      'trauma response', 'traumatic event', 'dissociating',
      'nightmares', 'hypervigilant', 'emotional numbness'
    ],
    low: [
      'traumatic', 'painful memories', 'triggered', 'upset memories'
    ]
  },
  psychosis: {
    high: [
      'hearing voices', 'seeing things', 'not real', 'paranoid',
      'being watched', 'conspiracy', 'voices telling me'
    ],
    medium: [
      'hallucinations', 'delusions', 'losing touch with reality',
      'can\'t trust thoughts', 'confused about reality'
    ],
    low: [
      'strange thoughts', 'weird experiences', 'unusual perceptions'
    ]
  }
};

// Emergency resources
const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    website: 'https://suicidepreventionlifeline.org/',
    description: 'Free and confidential emotional support for people in suicidal crisis or emotional distress',
    available24x7: true
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    website: 'https://www.crisistextline.org/',
    description: 'Free, 24/7 support for those in crisis via text message',
    available24x7: true
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    description: 'Treatment referral and information service for mental health and substance use disorders',
    available24x7: true
  },
  {
    name: 'Emergency Services',
    phone: '911',
    description: 'For immediate medical emergencies or if you are in immediate danger',
    available24x7: true
  }
];

/**
 * Analyzes text content for crisis indicators
 */
export function detectCrisisContent(text: string): CrisisDetectionResult {
  const normalizedText = text.toLowerCase().trim();
  const triggeredKeywords: string[] = [];
  const detectedCategories: CrisisCategory[] = [];
  
  let highestRiskLevel: 'low' | 'medium' | 'high' | 'crisis' = 'low';
  let isHighRisk = false;

  // Check each category
  Object.entries(CRISIS_KEYWORDS).forEach(([categoryName, severityLevels]) => {
    const category = categoryName as keyof typeof CRISIS_KEYWORDS;
    const categoryKeywords: string[] = [];
    let categorySeverity: 'low' | 'medium' | 'high' = 'low';

    // Check severity levels (high to low)
    Object.entries(severityLevels).forEach(([severity, keywords]) => {
      keywords.forEach(keyword => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          triggeredKeywords.push(keyword);
          categoryKeywords.push(keyword);
          categorySeverity = severity as 'low' | 'medium' | 'high';
          
          // Update overall risk level
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

    // Add category if keywords were found
    if (categoryKeywords.length > 0) {
      detectedCategories.push({
        category,
        severity: categorySeverity,
        keywords: categoryKeywords
      });
    }
  });

  // Generate recommended actions based on detected content
  const recommendedActions = generateRecommendedActions(detectedCategories, highestRiskLevel);
  
  // Filter emergency resources based on detected categories
  const relevantResources = getRelevantResources(detectedCategories);

  return {
    isHighRisk,
    riskLevel: highestRiskLevel,
    triggeredKeywords,
    detectedCategories,
    recommendedActions,
    emergencyResources: relevantResources
  };
}

/**
 * Generates recommended actions based on detected crisis content
 */
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
    actions.push('Use healthy coping strategies you\'ve learned');
    actions.push('Monitor your thoughts and feelings closely');
  } else if (riskLevel === 'medium') {
    actions.push('Schedule an appointment with a mental health professional');
    actions.push('Practice self-care and stress management techniques');
    actions.push('Connect with supportive people in your life');
    actions.push('Continue with your CBT exercises and coping strategies');
  }

  // Category-specific recommendations
  categories.forEach(category => {
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

/**
 * Returns relevant emergency resources based on detected categories
 */
function getRelevantResources(_categories: CrisisCategory[]): EmergencyResource[] {
  // Always include suicide prevention and general crisis resources
  const relevantResources = [...EMERGENCY_RESOURCES];
  
  // Could be extended to include category-specific resources
  // For now, return all available resources as they're all generally helpful
  
  return relevantResources;
}

/**
 * Checks if content requires immediate intervention
 */
export function requiresImmediateIntervention(result: CrisisDetectionResult): boolean {
  return result.riskLevel === 'crisis' || 
         (result.isHighRisk && result.detectedCategories.some(cat => 
           cat.category === 'suicide' && cat.severity === 'high'
         ));
}

/**
 * Generates a formatted crisis alert message
 */
export function generateCrisisAlert(result: CrisisDetectionResult): string {
  if (!result.isHighRisk) return '';

  const categoryNames = result.detectedCategories.map(cat => 
    cat.category.replace('_', ' ')
  ).join(', ');

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