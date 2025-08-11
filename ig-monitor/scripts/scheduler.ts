#!/usr/bin/env tsx
import cron from 'node-cron';
import { env } from '../app/lib/env';
import { fileURLToPath } from 'url';
import { spawn } from 'node:child_process';

function runScript(path: string, args: string[] = []) {
  const child = spawn('tsx', [path, ...args], { stdio: 'inherit' });
  child.on('exit', (code) => console.log(`${path} exited with code ${code}`));
}

console.log(`Scheduling collector: ${env.SCRAPE_INTERVAL_CRON}`);
cron.schedule(env.SCRAPE_INTERVAL_CRON, () => runScript('scripts/collector.ts', ['--once']));
console.log(`Scheduling recompute: ${env.RECOMPUTE_INTERVAL_CRON}`);
cron.schedule(env.RECOMPUTE_INTERVAL_CRON, () => runScript('scripts/recompute.ts', ['--once']));

console.log('Scheduler started.');