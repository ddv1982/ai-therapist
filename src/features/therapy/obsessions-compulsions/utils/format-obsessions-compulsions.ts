import { ObsessionsCompulsionsData, ObsessionData, CompulsionData } from '@/types/therapy';
import { logger } from '@/lib/utils/logger';

/**
 * Format obsessions and compulsions data for chat display
 */
export function formatObsessionsCompulsionsForChat(data: ObsessionsCompulsionsData): string {
  const { obsessions, compulsions } = data;
  
  let content = '# Obsessions & Compulsions Tracker\n\n';

  if (obsessions.length > 0) {
    obsessions.forEach((obsession, index) => {
      const compulsion = compulsions[index];
      content += `## Pair ${index + 1}\n\n`;
      content += `### 🧠 Obsession\n`;
      content += `**Description:** ${obsession.obsession}\n`;
      content += `**Intensity:** ${obsession.intensity}/10\n`;
      if (obsession.triggers.length > 0) {
        content += `**Triggers:** ${obsession.triggers.join(', ')}\n`;
      }
      content += `**Recorded:** ${new Date(obsession.createdAt).toLocaleDateString()}\n\n`;

      if (compulsion) {
        content += `### 🔁 Compulsion\n`;
        content += `**Description:** ${compulsion.compulsion}\n`;
        content += `**Frequency:** ${compulsion.frequency}/10\n`;
        content += `**Duration:** ${compulsion.duration} minutes\n`;
        content += `**Relief Level:** ${compulsion.reliefLevel}/10\n`;
        content += `**Recorded:** ${new Date(compulsion.createdAt).toLocaleDateString()}\n\n`;
      }
    });
  }

  if (obsessions.length === 0 && compulsions.length === 0) {
    content += 'No obsessions or compulsions recorded yet.\n';
  }

  content += `\n*Last updated: ${new Date(data.lastModified).toLocaleString()}*`;

  return content;
}

/**
 * Parse obsessions and compulsions data from markdown content
 */
export function parseObsessionsCompulsionsFromMarkdown(content: string): ObsessionsCompulsionsData | null {
  try {
    // This is a simplified parser - in a real implementation, you might want to use a more robust markdown parser
    const obsessions: ObsessionData[] = [];
    const compulsions: CompulsionData[] = [];
    
    // Extract obsessions
    const obsessionMatches = content.match(/### Obsession \d+\n([\s\S]*?)(?=### (?:Obsession \d+|Compulsion \d+)|## Compulsions|$)/g);
    if (obsessionMatches) {
      obsessionMatches.forEach((match, index) => {
        const description = match.match(/\*\*Description:\*\* (.+?)\n/)?.[1];
        const intensity = parseInt(match.match(/\*\*Intensity:\*\* (\d+)\/10/)?.[1] || '5');
        const triggers = match.match(/\*\*Triggers:\*\* (.+?)\n/)?.[1]?.split(', ').map(t => t.trim()) || [];
        const createdAt = match.match(/\*\*Recorded:\*\* (.+?)\n/)?.[1] || new Date().toISOString();
        
        if (description) {
          obsessions.push({
            id: `obsession-${index}`,
            obsession: description,
            intensity,
            triggers,
            createdAt
          });
        }
      });
    }
    
    // Extract compulsions
    const compulsionMatches = content.match(/### Compulsion \d+\n([\s\S]*?)(?=### (?:Obsession \d+|Compulsion \d+)|$)/g);
    if (compulsionMatches) {
      compulsionMatches.forEach((match, index) => {
        const description = match.match(/\*\*Description:\*\* (.+?)\n/)?.[1];
        const frequency = parseInt(match.match(/\*\*Frequency:\*\* (\d+)\/10/)?.[1] || '5');
        const duration = parseInt(match.match(/\*\*Duration:\*\* (\d+) minutes/)?.[1] || '10');
        const reliefLevel = parseInt(match.match(/\*\*Relief Level:\*\* (\d+)\/10/)?.[1] || '5');
        const createdAt = match.match(/\*\*Recorded:\*\* (.+?)\n/)?.[1] || new Date().toISOString();
        
        if (description) {
          compulsions.push({
            id: `compulsion-${index}`,
            compulsion: description,
            frequency,
            duration,
            reliefLevel,
            createdAt
          });
        }
      });
    }
    
    return {
      obsessions,
      compulsions,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    // Structured logging; parser runs in client or server contexts
    logger.error('Error parsing obsessions and compulsions data', { module: 'format-obsessions-compulsions' }, error as Error);
    return null;
  }
}
