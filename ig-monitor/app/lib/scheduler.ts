import cron from 'node-cron';
import { env } from './env';

let initialized = false;

function start() {
  if (initialized) return;
  initialized = true;
  // In-app scheduler is a noop by default in production; use scripts/scheduler.ts or Replit Scheduler
  // Keeping imports lazy to avoid load-time heavy deps
  try { /* no-op */ } catch {}
}

start();