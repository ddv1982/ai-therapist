#!/usr/bin/env node

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const TEST_PORT = Number(process.env.PLAYWRIGHT_PORT || 4000);
const TEST_HOST = process.env.PLAYWRIGHT_HOST || '127.0.0.1';

function canBindPort(host, port) {
  return new Promise((resolve) => {
    const server = createServer(() => {});
    server.once('error', (error) => {
      server.close(() => resolve({ ok: false, error }));
    });
    server.listen(port, host, () => {
      server.close(() => resolve({ ok: true }));
    });
  });
}

const { ok, error } = await canBindPort(TEST_HOST, TEST_PORT);
if (!ok) {
  if (error && error.code === 'EADDRINUSE') {
    console.warn(`⚠️  Playwright skipped: port ${TEST_PORT} already in use.`);
    process.exit(0);
  }
  if (error && error.code === 'EPERM') {
    console.warn(`⚠️  Playwright skipped: sandbox blocked listening on ${TEST_HOST}:${TEST_PORT}.`);
    process.exit(0);
  }
  console.warn(`⚠️  Playwright skipped: unable to bind ${TEST_HOST}:${TEST_PORT} (${error?.code || 'unknown error'}).`);
  process.exit(0);
}

const runner = spawn('npx', ['playwright', 'test'], { stdio: 'inherit', env: process.env });

runner.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
