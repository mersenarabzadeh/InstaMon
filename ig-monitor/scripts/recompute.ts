#!/usr/bin/env tsx
import { prisma } from '../app/lib/db';
import { getHandles, env } from '../app/lib/env';
import { recomputeWindowsAndTrending } from '../app/lib/metrics';
import { broadcastAlert } from '../app/lib/alerts';

async function runOnce() {
  const handles = getHandles();

  // fetch previous snapshots for comparison
  const prevTrending = await prisma.trendingNow.findMany({
    orderBy: [{ computedAt: 'desc' }, { rank: 'asc' }],
    take: 50,
  });
  const prevTop12 = await prisma.windowTop.findMany({
    where: { window: 'H12' },
    orderBy: [{ computedAt: 'desc' }, { rank: 'asc' }],
    take: 20,
  });

  const { best12, trend } = await recomputeWindowsAndTrending(handles);

  // Alerts: velocity threshold crossings and entering top-5 of 12h
  const prevTrendByPost = new Map(prevTrending.map((t) => [t.postId, t]));
  const prevTop12Ids = new Set(prevTop12.filter((t) => t.rank <= 5).map((t) => t.postId));
  const nowTop12Ids = new Set(best12.slice(0, 5).map((t) => t.postId));

  for (const t of trend) {
    const prev = prevTrendByPost.get(t.postId);
    const crossed = (!prev || prev.velocityRatio < env.TREND_RATIO_THRESHOLD) && t.velocityRatio >= env.TREND_RATIO_THRESHOLD;
    if (crossed && t.interactions >= env.MIN_TREND_INTERACTIONS) {
      const p = await prisma.igPost.findUnique({ where: { id: t.postId } , include: { account: true }});
      if (p) {
        const text = `🔥 Trending: @${p.account.handle} — ${p.caption?.slice(0, 80) || ''}\nInt: ${t.interactions} | Ratio: ${t.velocityRatio.toFixed(2)}\n${p.permalink}`;
        await broadcastAlert(text);
      }
    }
  }

  for (const id of nowTop12Ids) {
    if (!prevTop12Ids.has(id)) {
      const p = await prisma.igPost.findUnique({ where: { id }, include: { account: true } });
      if (p) {
        const text = `⭐ New Top 5 (12h): @${p.account.handle} — ${p.caption?.slice(0, 80) || ''}\n${p.permalink}`;
        await broadcastAlert(text);
      }
    }
  }
}

if (require.main === module) {
  const once = process.argv.includes('--once');
  runOnce().then(() => { if (once) process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}