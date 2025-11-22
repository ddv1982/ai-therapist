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

/**
 * Get Convex HTTP client with authentication token for server-side API routes
 * This allows Convex functions to access ctx.auth.getUserIdentity()
 */
export function getConvexHttpClientWithAuth(token: string): ConvexHttpClient {
  const url = env.CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('Convex URL not configured. Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL');
  }
  const base = url.split('?')[0];
  const client = new ConvexHttpClient(base);
  client.setAuth(token);
  return client;
}

export { api, anyApi };
