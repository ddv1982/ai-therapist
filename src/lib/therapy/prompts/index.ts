import type { AppLocale } from '@/i18n/config';
import type { MemoryContext } from '@/types/api';

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
  return buildTherapySystemPrompt(locale, opts);
}

export function getReportPrompt(locale: AppLocale): string {
  return locale === 'nl' ? REPORT_PROMPT_NL : REPORT_GENERATION_PROMPT;
}
