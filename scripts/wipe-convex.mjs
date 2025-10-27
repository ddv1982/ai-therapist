#!/usr/bin/env node
import { getConvexHttpClient, anyApi } from '../src/lib/convex/http-client.js';

async function main() {
  const tokenArg = process.argv.find(a => a.startsWith('--token='));
  const token = tokenArg ? tokenArg.split('=')[1] : process.env.WIPE_TOKEN;
  if (!token) {
    console.error('Usage: node scripts/wipe-convex.mjs --token=YOUR_TOKEN');
    process.exit(1);
  }

  try {
    const client = getConvexHttpClient();
    const result = await client.mutation(anyApi.admin.wipeAll, { token });
    console.log('Convex wipe completed:', result);
    process.exit(0);
  } catch (err) {
    console.error('Convex wipe failed:', err?.message || err);
    process.exit(2);
  }
}

main();
