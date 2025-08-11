import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  HANDLES: z.string().default(
    "alarabiya.farsi,manotoofficial,radiofarda,iranintltv,euronews_persian,voafarsi,radiozamaneh,bbcpersian,dw_persian"
  ),
  SCRAPE_INTERVAL_CRON: z.string().default("*/10 * * * *"),
  RECOMPUTE_INTERVAL_CRON: z.string().default("0 */2 * * *"),
  MIN_TREND_INTERACTIONS: z.string().default("50").transform((v) => parseInt(v, 10)),
  TREND_RATIO_THRESHOLD: z.string().default("2.0").transform(parseFloat),
  HTTP_PROXY: z.string().optional(),
  HTTPS_PROXY: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  HANDLES: process.env.HANDLES,
  SCRAPE_INTERVAL_CRON: process.env.SCRAPE_INTERVAL_CRON,
  RECOMPUTE_INTERVAL_CRON: process.env.RECOMPUTE_INTERVAL_CRON,
  MIN_TREND_INTERACTIONS: process.env.MIN_TREND_INTERACTIONS,
  TREND_RATIO_THRESHOLD: process.env.TREND_RATIO_THRESHOLD,
  HTTP_PROXY: process.env.HTTP_PROXY || process.env.http_proxy,
  HTTPS_PROXY: process.env.HTTPS_PROXY || process.env.https_proxy,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
});

export function getHandles(): string[] {
  return env.HANDLES.split(",").map((h) => h.trim()).filter(Boolean);
}