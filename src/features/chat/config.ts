import { MODEL_IDS } from '@/ai/model-metadata';

export const DEFAULT_MODEL_ID = MODEL_IDS.default;
export const ANALYTICAL_MODEL_ID = MODEL_IDS.analytical;
export const LOCAL_MODEL_ID = MODEL_IDS.local;

export const DEFAULT_CHAT_SETTINGS = {
  model: DEFAULT_MODEL_ID,
  webSearchEnabled: false,
};

export const REPORT_MODEL_ID = ANALYTICAL_MODEL_ID;


