import 'server-only';
import type { Locale } from '@/i18n/routing';
import type { MemoryContext } from './prompts';
export type { MemoryContext };
import {
  THERAPY_SYSTEM_PROMPT_EN,
  REPORT_PROMPT_EN,
  REPORT_PROMPT_NL,
  WEB_SEARCH_EN,
  MEMORY_SECTION_EN,
  THERAPY_SYSTEM_PROMPT_NL,
  WEB_SEARCH_NL,
  MEMORY_SECTION_NL,
  ANALYSIS_EXTRACTION_PROMPT_TEXT,
} from './prompts';

function asText(value: string | Buffer): string {
  return typeof value === 'string' ? value : value.toString('utf-8');
}

export const THERAPY_SYSTEM_PROMPT = asText(THERAPY_SYSTEM_PROMPT_EN);
export const REPORT_GENERATION_PROMPT = asText(REPORT_PROMPT_EN);
export { ANALYSIS_EXTRACTION_PROMPT_TEXT };

const EN_MEMORY_ANCHOR = 'Remember: Your primary role is to listen deeply';

type PromptOptions = { memory?: MemoryContext[]; webSearch?: boolean } | undefined;

export function buildTherapySystemPrompt(locale: Locale = 'en', opts?: PromptOptions): string {
  const memory = opts?.memory ?? [];
  const includeWebSearch = Boolean(opts?.webSearch);

  if (locale === 'nl') {
    const parts: string[] = [THERAPY_SYSTEM_PROMPT_NL];
    if (memory.length > 0) parts.push(MEMORY_SECTION_NL(memory));
    if (includeWebSearch) parts.push(WEB_SEARCH_NL);
    return parts.join('\n\n');
  }

  let prompt = asText(THERAPY_SYSTEM_PROMPT_EN);

  if (memory.length > 0) {
    const memorySection = MEMORY_SECTION_EN(memory);
    prompt = prompt.includes(EN_MEMORY_ANCHOR)
      ? prompt.replace(EN_MEMORY_ANCHOR, `${memorySection}\n${EN_MEMORY_ANCHOR}`)
      : `${prompt}\n\n${memorySection}`;
  }

  if (includeWebSearch) {
    prompt = `${prompt}\n\n${WEB_SEARCH_EN}`;
  }

  return prompt;
}

export function buildMemoryEnhancedPrompt(
  memoryContext: MemoryContext[] = [],
  locale: Locale = 'en'
): string {
  return buildTherapySystemPrompt(locale, { memory: memoryContext });
}

// Public API functions
export function getTherapySystemPrompt(
  locale: Locale,
  opts?: { memory?: MemoryContext[]; webSearch?: boolean }
): string {
  return buildTherapySystemPrompt(locale, opts);
}

export function getReportPrompt(locale: Locale): string {
  return locale === 'nl' ? REPORT_PROMPT_NL : asText(REPORT_PROMPT_EN);
}
