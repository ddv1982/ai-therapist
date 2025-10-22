import type { AppLocale } from '@/i18n/config';
import type { MemoryContext } from '../therapy-prompts';

type LocalMemoryContext = {
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  summary: string;
  content: string;
};

import {
  THERAPY_SYSTEM_PROMPT_EN,
  REPORT_PROMPT_EN,
  WEB_SEARCH_EN,
  MEMORY_SECTION_EN,
} from './en';

import {
  THERAPY_SYSTEM_PROMPT_NL,
  REPORT_PROMPT_NL,
  WEB_SEARCH_NL,
  MEMORY_SECTION_NL,
} from './nl';

import { buildTherapySystemPrompt, REPORT_GENERATION_PROMPT } from '../therapy-prompts';

type PromptOptions = { memory?: LocalMemoryContext[]; webSearch?: boolean } | undefined;

function mapMemoryContext(memory?: MemoryContext[]): LocalMemoryContext[] | undefined {
  if (!memory) return undefined;
  return memory.map((entry) => ({
    sessionTitle: entry.sessionTitle,
    sessionDate: entry.sessionDate,
    reportDate: entry.reportDate,
    summary: entry.summary,
    content: entry.content,
  }));
}

export {
  THERAPY_SYSTEM_PROMPT_EN,
  REPORT_PROMPT_EN,
  WEB_SEARCH_EN,
  MEMORY_SECTION_EN,
  THERAPY_SYSTEM_PROMPT_NL,
  REPORT_PROMPT_NL,
  WEB_SEARCH_NL,
  MEMORY_SECTION_NL,
};

export function getTherapySystemPrompt(
  locale: AppLocale,
  opts?: { memory?: MemoryContext[]; webSearch?: boolean }
): string {
  const mapped: PromptOptions = opts
    ? { memory: mapMemoryContext(opts.memory), webSearch: opts.webSearch }
    : undefined;
  return buildTherapySystemPrompt(locale, mapped as PromptOptions);
}

export function getReportPrompt(locale: AppLocale): string {
  return locale === 'nl' ? REPORT_PROMPT_NL : REPORT_GENERATION_PROMPT;
}
