import { reloadServerEnvForTesting } from '@/config/env';
import { reloadPublicEnvForTesting } from '@/config/env.public';

const originalValues = new Map<string, string | undefined>();

export function setEnv(name: string, value: string | undefined): void {
  if (!originalValues.has(name)) {
    originalValues.set(name, process.env[name]);
  }
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  reloadServerEnvForTesting();
  reloadPublicEnvForTesting();
}

export function restoreEnv(name: string): void {
  if (!originalValues.has(name)) return;
  const original = originalValues.get(name);
  if (original === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = original;
  }
  reloadServerEnvForTesting();
  reloadPublicEnvForTesting();
  originalValues.delete(name);
}

export async function withEnv<T>(name: string, value: string | undefined, fn: () => Promise<T>): Promise<T>;
export async function withEnv<T>(name: string, value: string | undefined, fn: () => T): Promise<T>;
export async function withEnv<T>(name: string, value: string | undefined, fn: () => T | Promise<T>): Promise<T> {
  setEnv(name, value);
  try {
    return await fn();
  } finally {
    restoreEnv(name);
  }
}

export function resetTestEnv(): void {
  for (const key of Array.from(originalValues.keys())) {
    restoreEnv(key);
  }
}
