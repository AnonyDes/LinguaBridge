#!/usr/bin/env node

/**
 * LinguaBridge Universal Interoperability Suite - 4-Tier E2E Test Suite Runner
 * 
 * Execution:
 *   node tests/e2e/runner.js
 *   vitest run tests/e2e
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '../..');
const vitestConfig = path.resolve(__dirname, 'vitest.config.ts');

console.log('='.repeat(80));
console.log('🚀 LinguaBridge 4-Tier Requirement-Driven E2E Test Suite');
console.log('='.repeat(80));
console.log(`Directory:   ${__dirname}`);
console.log(`Config:      ${vitestConfig}`);
console.log(`Node Target: ${process.version}`);
console.log('='.repeat(80));

const args = ['vitest', 'run', '-c', vitestConfig, ...process.argv.slice(2)];

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, args, {
  cwd: monorepoRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
});

child.on('close', (code) => {
  console.log('='.repeat(80));
  if (code === 0) {
    console.log('✅ ALL E2E TEST TIERS COMPLETED SUCCESSFULLY');
  } else {
    console.log(`❌ E2E TEST SUITE EXITED WITH CODE: ${code}`);
  }
  console.log('='.repeat(80));
  process.exit(code ?? 1);
});
