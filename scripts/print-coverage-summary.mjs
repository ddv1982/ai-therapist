import fs from 'node:fs';
import path from 'node:path';

const summaryPath = path.resolve('coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('coverage summary not found at coverage/coverage-summary.json');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = json.total;

const thr = { statements: 70, branches: 70, functions: 70, lines: 70 };
const fmt = (n) => `${Number(n).toFixed(2)}%`;

const res = {
  statements: total.statements.pct,
  branches: total.branches.pct,
  functions: total.functions.pct,
  lines: total.lines.pct,
};

const pass =
  res.statements >= thr.statements &&
  res.branches >= thr.branches &&
  res.functions >= thr.functions &&
  res.lines >= thr.lines;

console.log(
  `QA Summary: Statements ${fmt(res.statements)}, Branches ${fmt(res.branches)}, ` +
    `Functions ${fmt(res.functions)}, Lines ${fmt(res.lines)} — thresholds 70% — ${pass ? 'PASSED' : 'FAILED'}`
);

process.exit(pass ? 0 : 1);
