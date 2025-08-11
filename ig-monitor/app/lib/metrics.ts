import { prisma } from "./db";
import { env } from "./env";
import { Prisma } from "../generated/prisma";

export type BestOfPost = {
  postId: string;
  handle: string;
  permalink: string;
  caption: string;
  takenAt: Date;
  likes: number;
  comments: number;
  interactions: number;
  ogImageUrl: string;
};

export async function bestOf(windowHours: number, handles?: string[]): Promise<BestOfPost[]> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const handleFilterSql = handles && handles.length > 0 ? Prisma.sql`AND a.handle IN (${Prisma.join(handles)})` : Prisma.empty;

  const rows = await prisma.$queryRaw<BestOfPost[]>`
    WITH metrics_window AS (
      SELECT p.id AS post_id, a.handle, p.permalink, p.caption, p."takenAt", p."ogImageUrl",
             m.ts, m.likes, m.comments, (m.likes + m.comments) AS interactions
      FROM "IgPost" p
      JOIN "IgAccount" a ON a.id = p."accountId"
      JOIN "IgMetric" m ON m."postId" = p.id
      WHERE p."takenAt" >= ${since}
        AND m.ts >= ${since}
        ${handleFilterSql}
    ), max_interactions AS (
      SELECT post_id, MAX(interactions) AS max_interactions
      FROM metrics_window
      GROUP BY post_id
    ), picked AS (
      SELECT mw.post_id AS "postId", mw.handle, mw.permalink, mw.caption, mw."takenAt", mw."ogImageUrl",
             mw.likes, mw.comments, mw.interactions,
             ROW_NUMBER() OVER (PARTITION BY mw.post_id ORDER BY mw.interactions DESC, mw.ts DESC) AS rn
      FROM metrics_window mw
      JOIN max_interactions mi ON mi.post_id = mw.post_id AND mi.max_interactions = mw.interactions
    )
    SELECT * FROM picked WHERE rn = 1
    ORDER BY interactions DESC, "takenAt" DESC
    LIMIT 100;
  `;
  return rows;
}

export type TrendingRow = {
  postId: string;
  handle: string;
  permalink: string;
  takenAt: Date;
  interactions: number;
  minutesSincePublish: number;
  velocity: number;
  velocityRatio: number;
  ogImageUrl: string;
};

export async function trendingNow(handles?: string[]): Promise<TrendingRow[]> {
  const handleFilterSql = handles && handles.length > 0 ? Prisma.sql`AND a.handle IN (${Prisma.join(handles)})` : Prisma.empty;
  const rows = await prisma.$queryRaw<TrendingRow[]>`
    WITH latest AS (
      SELECT p.id AS "postId", a.handle, p.permalink, p."takenAt", p."ogImageUrl",
             EXTRACT(EPOCH FROM (NOW() - p."takenAt")) / 60 AS minutes,
             m.likes, m.comments, (m.likes + m.comments) AS interactions,
             ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY m.ts DESC) AS rn
      FROM "IgPost" p
      JOIN "IgAccount" a ON a.id = p."accountId"
      JOIN "IgMetric" m ON m."postId" = p.id
      WHERE p."takenAt" >= NOW() - INTERVAL '24 hours'
        ${handleFilterSql}
    ), latest_only AS (
      SELECT * FROM latest WHERE rn = 1
    ), baseline AS (
      SELECT a.id AS account_id,
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (im.likes + im.comments) / GREATEST(EXTRACT(EPOCH FROM (im.ts - p."takenAt")) / 60, 1)) AS median_velocity
      FROM "IgAccount" a
      JOIN "IgPost" p ON p."accountId" = a.id
      JOIN "IgMetric" im ON im."postId" = p.id
      WHERE p."takenAt" >= NOW() - INTERVAL '30 days'
        AND im.ts >= p."takenAt" + INTERVAL '30 minutes'
        AND im.ts <= p."takenAt" + INTERVAL '24 hours'
      GROUP BY a.id
    )
    SELECT l."postId", l.handle, l.permalink, l."takenAt",
           l.interactions::int AS interactions,
           CEIL(l.minutes)::int AS "minutesSincePublish",
           (l.interactions / GREATEST(l.minutes, 1))::float AS velocity,
           CASE WHEN b.median_velocity IS NULL OR b.median_velocity = 0
                THEN 0
                ELSE (l.interactions / GREATEST(l.minutes, 1)) / b.median_velocity END AS "velocityRatio",
           l."ogImageUrl"
    FROM latest_only l
    JOIN "IgPost" p ON p.id = l."postId"
    JOIN "IgAccount" a ON a.id = p."accountId"
    LEFT JOIN baseline b ON b.account_id = a.id
    WHERE l.interactions >= ${env.MIN_TREND_INTERACTIONS}
      AND (CASE WHEN b.median_velocity IS NULL OR b.median_velocity = 0 THEN 0 ELSE (l.interactions / GREATEST(l.minutes, 1)) / b.median_velocity END) >= ${env.TREND_RATIO_THRESHOLD}
    ORDER BY "velocityRatio" DESC NULLS LAST, "takenAt" DESC
    LIMIT 50;
  `;
  return rows;
}

export async function recomputeWindowsAndTrending(handles?: string[]) {
  // Compute best of 12h and 24h, and trending; persist into tables with ranks
  const [best12, best24, trend] = await Promise.all([
    bestOf(12, handles),
    bestOf(24, handles),
    trendingNow(handles),
  ]);

  const now = new Date();
  await prisma.$transaction([
    prisma.windowTop.createMany({
      data: best12.map((r, idx) => ({
        window: "H12",
        computedAt: now,
        postId: r.postId,
        interactions: r.interactions,
        rank: idx + 1,
      })),
    }),
    prisma.windowTop.createMany({
      data: best24.map((r, idx) => ({
        window: "H24",
        computedAt: now,
        postId: r.postId,
        interactions: r.interactions,
        rank: idx + 1,
      })),
    }),
    prisma.trendingNow.createMany({
      data: trend.map((t, idx) => ({
        computedAt: now,
        postId: t.postId,
        velocity: t.velocity,
        velocityRatio: t.velocityRatio,
        interactions: t.interactions,
        minutesSincePublish: t.minutesSincePublish,
        rank: idx + 1,
      })),
    }),
  ]);

  return { best12, best24, trend };
}