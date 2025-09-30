import type { AppLocale } from '@/i18n/config';
import type { MemoryContext } from '../therapy-prompts';

import { THERAPY_SYSTEM_PROMPT_EN, REPORT_PROMPT_EN, WEB_SEARCH_EN, MEMORY_SECTION_EN } from './en';
import { THERAPY_SYSTEM_PROMPT_NL, REPORT_PROMPT_NL, WEB_SEARCH_NL, MEMORY_SECTION_NL } from './nl';

export function getTherapySystemPrompt(
  locale: AppLocale,
  opts?: { memory?: MemoryContext[]; webSearch?: boolean }
): string {
  if (locale === 'nl') {
    const parts: string[] = [THERAPY_SYSTEM_PROMPT_NL];
    if (opts?.memory && opts.memory.length > 0) parts.push(MEMORY_SECTION_NL(opts.memory));
    if (opts?.webSearch) parts.push(WEB_SEARCH_NL);
    return parts.join('\n\n');
  }

  // English – preserve exact historical behavior for tests when no tools/memory
  let prompt = THERAPY_SYSTEM_PROMPT_EN;
  if (opts?.memory && opts.memory.length > 0) {
    // Append (non-breaking) memory section; not used by current chat route
    prompt = `${prompt}\n\n${MEMORY_SECTION_EN(opts.memory)}`;
  }
  if (opts?.webSearch) prompt = `${prompt}\n\n${WEB_SEARCH_EN}`;
  return prompt;
}

export function getReportPrompt(locale: AppLocale): string {
  return locale === 'nl' ? REPORT_PROMPT_NL : REPORT_PROMPT_EN;
}
