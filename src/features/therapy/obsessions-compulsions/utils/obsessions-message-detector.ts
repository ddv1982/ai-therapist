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
