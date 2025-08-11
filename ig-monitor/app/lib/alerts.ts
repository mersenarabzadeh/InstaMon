import { env } from "./env";
import { request } from "undici";

export async function sendSlack(text: string) {
  if (!env.SLACK_WEBHOOK_URL) return;
  await request(env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}

export async function sendTelegram(text: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = new URLSearchParams({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: "true" }).toString();
  await request(url, { method: "POST", headers: { 'content-type': 'application/x-www-form-urlencoded' }, body }).catch(() => {});
}

export async function broadcastAlert(text: string) {
  await Promise.all([sendSlack(text), sendTelegram(text)]);
}