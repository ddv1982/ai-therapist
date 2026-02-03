#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';

const summaryPath = path.resolve('coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('coverage summary not found at coverage/coverage-summary.json');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
  total: {
    statements: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
    lines: { pct: number };
  };
};
const total = json.total;

const thresholds = { statements: 70, branches: 70, functions: 70, lines: 70 };
const fmt = (n: number) => `${Number(n).toFixed(2)}%`;

const result = {
  statements: total.statements.pct,
  branches: total.branches.pct,
  functions: total.functions.pct,
  lines: total.lines.pct,
};

const pass =
  result.statements >= thresholds.statements &&
  result.branches >= thresholds.branches &&
  result.functions >= thresholds.functions &&
  result.lines >= thresholds.lines;

console.log(
  `QA Summary: Statements ${fmt(result.statements)}, Branches ${fmt(result.branches)}, ` +
    `Functions ${fmt(result.functions)}, Lines ${fmt(result.lines)} — thresholds 70% — ${pass ? 'PASSED' : 'FAILED'}`
);

process.exit(pass ? 0 : 1);
