#!/usr/bin/env node
import { runCli } from './index';

runCli().catch((err) => {
  if (err && err.name !== 'CommanderError') {
    console.error(`\x1b[31mFatal error:\x1b[0m ${err.message || err}`);
  }
  process.exit(1);
});
