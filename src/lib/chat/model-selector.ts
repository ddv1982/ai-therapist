export interface ModelDecision {
  model: string;
  tools: string[];
}

import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';

export function selectModelAndTools(input: { message: string; preferredModel?: string; webSearchEnabled?: boolean }): ModelDecision {
  const tools: string[] = [];
  let model = input.preferredModel || DEFAULT_MODEL_ID;
  if (input.webSearchEnabled) {
    tools.push('web-search');
    model = ANALYTICAL_MODEL_ID;
  }
  if (/analy(s|z)e|cbt|schema|plan|report/i.test(input.message)) {
    model = ANALYTICAL_MODEL_ID;
  }
  return { model, tools };
}


