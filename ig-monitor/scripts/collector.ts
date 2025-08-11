#!/usr/bin/env tsx
import { chromium, Browser, Page } from 'playwright';
import { prisma } from '../app/lib/db';
import { env, getHandles } from '../app/lib/env';
import fs from 'node:fs/promises';
import path from 'node:path';

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function jitter(minMs: number, maxMs: number) {
  const delta = maxMs - minMs;
  return minMs + Math.floor(Math.random() * (delta + 1));
}

type ParsedPost = {
  permalink: string;
  shortcode: string;
  takenAt?: string;
  likes?: number;
  comments?: number;
  caption?: string;
  ogImageUrl?: string;
};

async function extractPostsFromProfile(page: Page, handle: string): Promise<string[]> {
  const url = `https://www.instagram.com/${handle}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(500);
  const links = await page.$$eval('article a[href*="/p/"], a[href*="/reel/"]', (as) =>
    Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).href))).slice(0, 18)
  ).catch(() => [] as string[]);
  return links.slice(0, 12);
}

async function parsePost(page: Page, permalink: string, opts?: { preloaded?: boolean }): Promise<ParsedPost> {
  const result: ParsedPost = { permalink, shortcode: permalink.split('/').filter(Boolean).pop() || '' };
  try {
    if (!opts?.preloaded) {
      await page.goto(permalink, { waitUntil: 'domcontentloaded', timeout: 10000 });
    }
  } catch {}

  try {
    await page.waitForSelector('time[datetime]', { timeout: jitter(6000, 10000) });
    const takenAt = await page.$eval('time[datetime]', (el) => (el as HTMLTimeElement).dateTime);
    result.takenAt = takenAt;
  } catch {}

  // Counts extraction with fallbacks
  try {
    const text = await page.textContent('body');
    if (text) {
      const likeMatch = text.match(/([\d,.]+)\s+likes?/i);
      const commentMatch = text.match(/([\d,.]+)\s+comments?/i);
      if (likeMatch) result.likes = parseInt(likeMatch[1].replace(/[^\d]/g, ''), 10);
      if (commentMatch) result.comments = parseInt(commentMatch[1].replace(/[^\d]/g, ''), 10);
    }
  } catch {}

  if (result.likes === undefined || result.comments === undefined) {
    // aria labels
    try {
      const aria = await page.$$eval('[aria-label]', (els) => els.map((e) => e.getAttribute('aria-label') || '').join(' '));
      const likeMatch = aria.match(/([\d,.]+)\s+likes?/i);
      const commentMatch = aria.match(/([\d,.]+)\s+comments?/i);
      if (result.likes === undefined && likeMatch) result.likes = parseInt(likeMatch[1].replace(/[^\d]/g, ''), 10);
      if (result.comments === undefined && commentMatch) result.comments = parseInt(commentMatch[1].replace(/[^\d]/g, ''), 10);
    } catch {}
  }

  try {
    const caption = await page.$eval('h1, header ~ div div[role="button"] div div', (el) => el.textContent || '');
    if (caption) result.caption = caption.trim().slice(0, 140);
  } catch {}

  try {
    const og = await page.$eval('meta[property="og:image"]', (el) => (el as HTMLMetaElement).content);
    if (og) result.ogImageUrl = og;
  } catch {}

  if (result.likes === undefined) result.likes = 0;
  if (result.comments === undefined) result.comments = 0;
  return result;
}

async function runFixtures() {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const fixturesDir = path.join(process.cwd(), 'fixtures');
  const files = ['photo.html', 'reel.html', 'carousel.html'];
  for (const f of files) {
    try {
      const fp = path.join(fixturesDir, f);
      const html = await fs.readFile(fp, 'utf8');
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const permalink = `https://www.instagram.com/p/${f.replace('.html','')}/`;
      const data = await parsePost(page, permalink, { preloaded: true });
      console.log(`[DRY][${f}] shortcode=${data.shortcode} likes=${data.likes} comments=${data.comments} takenAt=${data.takenAt}`);
    } catch (e) {
      console.warn(`[DRY] fixture missing or parse error for ${f}`);
    }
  }
  await page.close();
  await context.close();
  await browser.close();
}

async function runOnce(dryRun = false) {
  if (dryRun) {
    await runFixtures();
    return;
  }
  const handles = getHandles();
  const browser: Browser = await chromium.launch({
    headless: true,
    proxy: env.HTTP_PROXY || env.HTTPS_PROXY ? { server: env.HTTP_PROXY || env.HTTPS_PROXY! } : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1024 } });

  try {
    for (const handle of handles) {
      const account = await prisma.igAccount.upsert({
        where: { handle },
        create: { handle, profileUrl: `https://www.instagram.com/${handle}/` },
        update: {},
      });

      const page = await context.newPage();
      const links = await extractPostsFromProfile(page, handle);
      const visited = new Set<string>();

      for (const link of links) {
        if (visited.has(link)) continue;
        visited.add(link);
        await sleep(jitter(5000, 10000));
        const postData = await parsePost(page, link);
        if (!postData.shortcode) continue;
        if (!postData.takenAt) continue;

        const post = await prisma.igPost.upsert({
          where: { accountId_shortcode: { accountId: account.id, shortcode: postData.shortcode } },
          create: {
            accountId: account.id,
            shortcode: postData.shortcode,
            permalink: postData.permalink,
            caption: postData.caption || '',
            takenAt: new Date(postData.takenAt),
            ogImageUrl: postData.ogImageUrl || '',
          },
          update: {
            permalink: postData.permalink,
            ogImageUrl: postData.ogImageUrl || undefined,
          },
        });

        const now = new Date();
        await prisma.igMetric.create({
          data: {
            postId: post.id,
            ts: now,
            likes: postData.likes ?? 0,
            comments: postData.comments ?? 0,
          },
        }).catch(() => {});
      }

      await page.close();
      await sleep(jitter(2000, 4000));
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

if (require.main === module) {
  const once = process.argv.includes('--once');
  const dry = process.argv.includes('--dry');
  runOnce(dry).then(() => { if (once) process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}