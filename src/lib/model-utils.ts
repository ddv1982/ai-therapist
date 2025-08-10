/**
 * Robust Model Selection Utility
 * Capability-based model selection that detects actual system requirements
 */

export interface ModelSelection {
  modelId: string;
  displayName: string;
  reason: string;
}

export interface WebSearchDetection {
  shouldUseWebSearch: boolean;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DeepThinkingDetection {
  shouldUseDeepThinking: boolean;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Robust detection of when web search API calls will be populated
 * STATELESS: Each message evaluated independently to prevent sticky behavior
 */
export function shouldUseWebSearch(
  content: string, 
  browserSearchEnabled: boolean
): WebSearchDetection {
  // If browser search is disabled by user, no web search
  if (!browserSearchEnabled) {
    return {
      shouldUseWebSearch: false,
      reason: 'Browser search disabled by user',
      confidence: 'high'
    };
  }

  // High confidence patterns - clear web search requests
  const highConfidencePatterns = [
    /\b(search|google|bing|find|look\s+up)\b.*\b(for|about|on)\b/i,
    /can\s+you\s+(search|find|look\s+up)/i,
    /please\s+(search|find|research|look\s+up)/i,
    /\b(youtube|wikipedia|google)\b.*\b(search|for|about)\b/i,
    /what\s+(is|are|was|were)\s+the\s+(latest|current|recent)/i,
    /current\s+(research|information|data|studies|trends)/i,
    /latest\s+(news|updates|information|research)/i,
    /recent\s+(studies|research|developments|findings)/i
  ];

  for (const pattern of highConfidencePatterns) {
    if (pattern.test(content)) {
      return {
        shouldUseWebSearch: true,
        reason: 'High confidence web search pattern detected',
        confidence: 'high'
      };
    }
  }

  // Medium confidence patterns - TIGHTENED to avoid false positives
  const mediumConfidencePatterns = [
    // Only questions explicitly asking for current/online information
    /what.*\b(current|latest|recent|now|today)\b.*\?$/i,
    /how.*\b(current|latest|recent|now|today)\b.*\?$/i,
    /where.*\b(current|latest|recent|now|today)\b.*\?$/i,
    /when.*\b(current|latest|recent|now|today)\b.*\?$/i,
    /\b(explain|describe)\b.*\b(current|modern|today|now|latest)\b/i,
    /\b(best|top|popular|recommended)\b.*\b(20\d{2}|current|now|today|latest)\b/i,
    // Information requests that clearly need web data
    /tell\s+me\s+about.*\b(current|latest|recent)\b/i,
    /information\s+(about|on).*\b(current|latest|recent)\b/i
  ];

  for (const pattern of mediumConfidencePatterns) {
    if (pattern.test(content)) {
      return {
        shouldUseWebSearch: true,
        reason: 'Medium confidence - query likely needs current information',
        confidence: 'medium'
      };
    }
  }

  // REMOVED: Conversation context detection to prevent "sticky" web search mode
  // Each message is now evaluated independently for clean, stateless behavior

  // Default to no web search for general conversation
  return {
    shouldUseWebSearch: false,
    reason: 'General conversation - no web search indicators',
    confidence: 'high'
  };
}

/**
 * Detect when user explicitly requests deep thinking/analysis
 * Priority: Higher than web search - for complex reasoning without external data
 */
export function shouldUseDeepThinking(content: string): DeepThinkingDetection {
  // High confidence patterns - explicit deep thinking requests
  const deepThinkingPatterns = [
    /\b(think\s+hard|think\s+carefully|think\s+deeply)\b/i,
    /\b(analyze\s+(deeply|carefully|thoroughly))\b/i,
    /\b(complex\s+(analysis|thinking|reasoning))\b/i,
    /\b(deep\s+(thought|analysis|consideration))\b/i,
    /\b(sophisticated\s+(analysis|reasoning))\b/i,
    /\b(comprehensive\s+(analysis|review))\b/i,
    /\b(detailed\s+(analysis|examination))\b/i,
    /ultrathink/i,
    /think\s+really\s+hard/i,
    /give\s+(this|it)\s+(deep|serious)\s+thought/i
  ];

  for (const pattern of deepThinkingPatterns) {
    if (pattern.test(content)) {
      return {
        shouldUseDeepThinking: true,
        reason: 'Explicit deep thinking request detected',
        confidence: 'high'
      };
    }
  }

  // Default to no deep thinking for regular conversation
  return {
    shouldUseDeepThinking: false,
    reason: 'No deep thinking patterns detected',
    confidence: 'high'
  };
}

/**
 * Select model based on actual system requirements rather than text guessing
 * STATELESS: No conversation context to prevent sticky model selection
 */
export function selectModelForRequirements(
  content: string,
  webSearchDetection: WebSearchDetection
): ModelSelection {
  // If web search is needed, use 120B model (only model that supports web search)
  if (webSearchDetection.shouldUseWebSearch) {
    return {
      modelId: 'openai/gpt-oss-120b',
      displayName: 'GPT OSS 120B (Deep Analysis + Web Search)',
      reason: `Web search required: ${webSearchDetection.reason}`
    };
  }

  // CBT diary patterns require analytical model
  if (/\*\*(Situation|Thoughts|Emotions|Physical Sensations|Behaviors):\*\*/i.test(content) ||
      /CBT Thought Record/i.test(content)) {
    return {
      modelId: 'openai/gpt-oss-120b',
      displayName: 'GPT OSS 120B (Deep Analysis)',
      reason: 'CBT content requires analytical processing'
    };
  }

  // Complex analysis patterns require analytical model
  if (/\b(analyze|analysis|comprehensive|detailed|complex|in.depth|therapeutic)\b/i.test(content)) {
    return {
      modelId: 'openai/gpt-oss-120b',
      displayName: 'GPT OSS 120B (Deep Analysis)',
      reason: 'Complex analysis request detected'
    };
  }

  // REMOVED: Conversation context check to prevent sticky analytical mode
  // Each message is evaluated independently for clean, stateless behavior

  // Default to fast model for general conversation
  return {
    modelId: 'openai/gpt-oss-20b',
    displayName: 'GPT OSS 20B',
    reason: 'General conversation - optimized for speed'
  };
}

/**
 * Select appropriate model based on content patterns
 */
export function selectModel(content: string): ModelSelection {
  // CBT diary patterns (highest priority for specificity)
  if (/\*\*(Situation|Thoughts|Emotions|Physical Sensations|Behaviors):\*\*/i.test(content) ||
      /CBT Thought Record/i.test(content)) {
    return {
      modelId: 'openai/gpt-oss-120b',
      displayName: 'GPT OSS 120B (Deep Analysis)',
      reason: 'CBT content detected'
    };
  }

  // Web search patterns
  if (/\b(search|find|look up|research|google)\b/i.test(content) ||
      /please research/i.test(content) ||
      /what (is|are|was|were|do|does|did|can|could|will|would).*\?/i.test(content) ||
      /tell me about/i.test(content) ||
      /information (on|about)/i.test(content) ||
      /current research|latest.*research|recent studies/i.test(content)) {
    return {
      modelId: 'openai/gpt-oss-120b',
      displayName: 'GPT OSS 120B (Deep Analysis)', 
      reason: 'Research/search request detected'
    };
  }

  // Analysis patterns
  if (/\b(analyze|analysis|comprehensive|detailed|complex|in.depth)\b/i.test(content)) {
    return {
      modelId: 'openai/gpt-oss-120b',
      displayName: 'GPT OSS 120B (Deep Analysis)',
      reason: 'Analysis request detected'
    };
  }

  // Default to fast model for regular conversation
  return {
    modelId: 'openai/gpt-oss-20b',
    displayName: 'GPT OSS 20B',
    reason: 'General conversation'
  };
}

/**
 * Check if model supports web search
 */
export function supportsWebSearch(modelId: string): boolean {
  return modelId === 'openai/gpt-oss-120b';
}

/**
 * Format model name for display
 */
export function formatModelName(modelId: string): string {
  const modelMap = {
    'openai/gpt-oss-20b': 'GPT OSS 20B',
    'openai/gpt-oss-120b': 'GPT OSS 120B (Deep Analysis)'
  };
  return modelMap[modelId as keyof typeof modelMap] || modelId;
}