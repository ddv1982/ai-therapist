import { ObsessionsCompulsionsData, ObsessionData, CompulsionData } from '@/types/therapy';
import { logger } from '@/lib/utils/logger';

function generateStableId(prefix: string, seed: string): string {
  const normalized =
    seed
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'entry';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `${prefix}-${normalized}-${hash.toString(16)}`;
}

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
export function parseObsessionsCompulsionsFromMarkdown(
  content: string
): ObsessionsCompulsionsData | null {
  try {
    const obsessions: ObsessionData[] = [];
    const compulsions: CompulsionData[] = [];

    const pairRegex = /## Pair \d+[\s\S]*?(?=## Pair \d+|$)/g;
    const pairMatches = content.match(pairRegex);

    if (pairMatches && pairMatches.length > 0) {
      pairMatches.forEach((pairContent) => {
        const obsessionSection = pairContent.match(/### [^\n]*Obsession[\s\S]*?(?=### [^\n]*|$)/);
        if (obsessionSection) {
          const description = extractMarkdownField(obsessionSection[0], 'Description');
          if (description) {
            const intensity = parseInt(
              extractMarkdownField(obsessionSection[0], 'Intensity')?.replace('/10', '') || '5',
              10
            );
            const triggersRaw = extractMarkdownField(obsessionSection[0], 'Triggers');
            const triggers = triggersRaw
              ? triggersRaw
                  .split(',')
                  .map((trigger) => trigger.trim())
                  .filter(Boolean)
              : [];
            const createdAtRaw = extractMarkdownField(obsessionSection[0], 'Recorded');
            const createdAt =
              createdAtRaw && !Number.isNaN(Date.parse(createdAtRaw))
                ? new Date(createdAtRaw).toISOString()
                : new Date().toISOString();

            const obsessionSeed = `${description}-${intensity}-${triggers.join(',')}`;
            obsessions.push({
              id: generateStableId('obsession', obsessionSeed),
              obsession: description,
              intensity: clampRating(intensity),
              triggers,
              createdAt,
            });
          }
        }

        const compulsionSection = pairContent.match(/### [^\n]*Compulsion[\s\S]*?(?=### [^\n]*|$)/);
        if (compulsionSection) {
          const description = extractMarkdownField(compulsionSection[0], 'Description');
          if (description) {
            const frequency = parseInt(
              extractMarkdownField(compulsionSection[0], 'Frequency')?.replace('/10', '') || '5',
              10
            );
            const duration = parseInt(
              extractMarkdownField(compulsionSection[0], 'Duration')
                ?.replace('minutes', '')
                .trim() || '10',
              10
            );
            const reliefLevel = parseInt(
              extractMarkdownField(compulsionSection[0], 'Relief Level')?.replace('/10', '') || '5',
              10
            );
            const createdAtRaw = extractMarkdownField(compulsionSection[0], 'Recorded');
            const createdAt =
              createdAtRaw && !Number.isNaN(Date.parse(createdAtRaw))
                ? new Date(createdAtRaw).toISOString()
                : new Date().toISOString();

            const compulsionSeed = `${description}-${frequency}-${duration}-${reliefLevel}`;
            compulsions.push({
              id: generateStableId('compulsion', compulsionSeed),
              compulsion: description,
              frequency: clampRating(frequency),
              duration: Number.isFinite(duration) ? duration : 10,
              reliefLevel: clampRating(reliefLevel),
              createdAt,
            });
          }
        }
      });
    }

    // Fallback for legacy format without Pair headings
    if (obsessions.length === 0) {
      const legacyObsessionMatches = content.match(/### [^\n]*Obsession[\s\S]*?(?=### [^\n]*|$)/g);
      legacyObsessionMatches?.forEach((match) => {
        const description = extractMarkdownField(match, 'Description');
        if (!description) return;
        const intensity = parseInt(
          extractMarkdownField(match, 'Intensity')?.replace('/10', '') || '5',
          10
        );
        const triggersRaw = extractMarkdownField(match, 'Triggers');
        const triggers = triggersRaw
          ? triggersRaw
              .split(',')
              .map((trigger) => trigger.trim())
              .filter(Boolean)
          : [];
        const createdAtRaw = extractMarkdownField(match, 'Recorded');
        const createdAt =
          createdAtRaw && !Number.isNaN(Date.parse(createdAtRaw))
            ? new Date(createdAtRaw).toISOString()
            : new Date().toISOString();

        const obsessionSeed = `${description}-${intensity}-${triggers.join(',')}`;
        obsessions.push({
          id: generateStableId('obsession', obsessionSeed),
          obsession: description,
          intensity: clampRating(intensity),
          triggers,
          createdAt,
        });
      });
    }

    if (compulsions.length === 0) {
      const legacyCompulsionMatches = content.match(
        /### [^\n]*Compulsion[\s\S]*?(?=### [^\n]*|$)/g
      );
      legacyCompulsionMatches?.forEach((match) => {
        const description = extractMarkdownField(match, 'Description');
        if (!description) return;
        const frequency = parseInt(
          extractMarkdownField(match, 'Frequency')?.replace('/10', '') || '5',
          10
        );
        const duration = parseInt(
          extractMarkdownField(match, 'Duration')?.replace('minutes', '').trim() || '10',
          10
        );
        const reliefLevel = parseInt(
          extractMarkdownField(match, 'Relief Level')?.replace('/10', '') || '5',
          10
        );
        const createdAtRaw = extractMarkdownField(match, 'Recorded');
        const createdAt =
          createdAtRaw && !Number.isNaN(Date.parse(createdAtRaw))
            ? new Date(createdAtRaw).toISOString()
            : new Date().toISOString();

        const seed = `${description}-${frequency}-${duration}-${reliefLevel}`;
        compulsions.push({
          id: generateStableId('compulsion', seed),
          compulsion: description,
          frequency: clampRating(frequency),
          duration: Number.isFinite(duration) ? duration : 10,
          reliefLevel: clampRating(reliefLevel),
          createdAt,
        });
      });
    }

    const lastUpdatedMatch = content.match(/\*Last updated: ([^*]+)\*/);
    const lastModifiedCandidate = lastUpdatedMatch?.[1]?.trim() ?? '';
    const lastModifiedDate =
      lastModifiedCandidate && !Number.isNaN(Date.parse(lastModifiedCandidate))
        ? new Date(lastModifiedCandidate)
        : new Date();

    return {
      obsessions,
      compulsions,
      lastModified: lastModifiedDate.toISOString(),
    };
  } catch (error) {
    logger.error(
      'Error parsing obsessions and compulsions data',
      { module: 'format-obsessions-compulsions' },
      error as Error
    );
    return null;
  }
}

function extractMarkdownField(section: string, field: string): string | undefined {
  const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*([^\\n]+)`);
  const match = section.match(regex);
  return match?.[1]?.trim();
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.min(Math.max(value, 0), 10);
}
