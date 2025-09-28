import { ensureCorsEnvValue, isMainModule } from './cors-helpers.js';

export function ensureCorsOriginCli(env = process.env) {
  const { value } = ensureCorsEnvValue(env, { silent: true });
  return value;
}

if (isMainModule(import.meta)) {
  try {
    const value = ensureCorsOriginCli();
    console.log(value);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
