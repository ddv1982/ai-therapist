import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { api } from '../../../convex/_generated/api';
import { env } from '@/config/env';

let cached: ConvexHttpClient | null = null;

export function getConvexHttpClient(): ConvexHttpClient {
  if (cached) return cached;
  const url = env.CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('Convex URL not configured. Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL');
  }
  const base = url.split('?')[0];
  cached = new ConvexHttpClient(base);
  return cached;
}

export { api, anyApi };
