/**
 * Detect if a message contains obsessions and compulsions data
 */
export function isObsessionsCompulsionsMessage(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  // Check for obsessions and compulsions markers
  const obsessionsMarkers = [
    '# Obsessions & Compulsions Tracker',
    '## Obsessions',
    '## Compulsions',
    '**Description:**',
    '**Intensity:**',
    '**Frequency:**',
    '**Duration:**',
    '**Relief Level:**',
  ];

  return obsessionsMarkers.some((marker) => content.includes(marker));
}

/**
 * Analyze obsessions and compulsions message content
 */
export function analyzeObsessionsMessage(content: string): {
  hasObsessions: boolean;
  hasCompulsions: boolean;
  obsessionsCount: number;
  compulsionsCount: number;
  confidence: number;
} {
  if (!isObsessionsCompulsionsMessage(content)) {
    return {
      hasObsessions: false,
      hasCompulsions: false,
      obsessionsCount: 0,
      compulsionsCount: 0,
      confidence: 0,
    };
  }

  const obsessionsSection = content.match(/## Obsessions([\s\S]*?)(?=## Compulsions|$)/);
  const compulsionsSection = content.match(/## Compulsions([\s\S]*?)(?=## |$)/);

  const obsessionsCount = obsessionsSection
    ? (obsessionsSection[1].match(/### Obsession \d+/g) || []).length
    : 0;
  const compulsionsCount = compulsionsSection
    ? (compulsionsSection[1].match(/### Compulsion \d+/g) || []).length
    : 0;

  const hasObsessions = obsessionsCount > 0;
  const hasCompulsions = compulsionsCount > 0;

  // Calculate confidence based on structure and content
  let confidence = 0.5; // Base confidence
  if (hasObsessions) confidence += 0.2;
  if (hasCompulsions) confidence += 0.2;
  if (content.includes('**Intensity:**')) confidence += 0.1;
  if (content.includes('**Frequency:**')) confidence += 0.1;

  return {
    hasObsessions,
    hasCompulsions,
    obsessionsCount,
    compulsionsCount,
    confidence: Math.min(confidence, 1.0),
  };
}
