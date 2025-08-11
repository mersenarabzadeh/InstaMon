# IG Monitor MVP

A production-friendly MVP for monitoring public Instagram pages without using Meta APIs.

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma (PostgreSQL), Playwright, node-cron, Slack/Telegram alerts.

## Features
- Collector every 10 minutes scrapes latest 12 posts per handle (photo/reel/carousel) with respectful delays and backoff.
- Saves time-series snapshots of likes/comments per post.
- Rolling windows: Trending (by velocity ratio), Best of 12h/24h.
- REST API: `/api/top?window=12h|24h`, `/api/trending`, `/api/health`, `/api/alerts/test`.
- Dashboard with filters and cards linking to Instagram permalinks.
- Alerts via Slack and Telegram for trending and new top-5 posts.

## Getting Started

1) Copy envs

```bash
cp .env.example .env
# edit DATABASE_URL, webhook/envs as needed
```

2) Install deps

```bash
pnpm install
```

3) Prisma setup

```bash
pnpm prisma:generate
pnpm prisma:dev
pnpm seed
```

4) Run dev

```bash
pnpm dev
```

5) Run collector and recompute once (manual)

```bash
pnpm scrape:once
pnpm recompute:once
```

6) Start in-app scheduler (optional)

```bash
pnpm cron
```

## Deployment on Replit
- Create a Replit Node.js project, import this repo.
- Set environment variables in Replit Secrets (DATABASE_URL, HANDLES, cron strings, webhooks).
- Add a Replit Scheduler task to run `pnpm cron` to keep collector and recompute running.
- Alternatively, configure two separate scheduled tasks: `pnpm scrape:once` every 10 minutes and `pnpm recompute:once` every 2 hours.

## API
- GET `/api/top?window=12h|24h&handle=...` returns array of posts sorted by interactions.
- GET `/api/trending?handle=...` returns posts with velocity and velocity_ratio.
- GET `/api/health` returns `{ ok: boolean }` if DB reachable and recent collector run.
- POST `/api/alerts/test` sends a test message to Slack/Telegram.

## Known Limitations
- Instagram HTML structure may change. Selectors are defensive but may require updates.
- Counts parsing is best-effort; if missing, zeros are used.
- No login or private data access; only public metadata is stored.
- For heavy scraping, use proxy via `HTTP_PROXY`/`HTTPS_PROXY`.

## Tests
- Unit tests: `pnpm test`
- Scraper dry-run: place HTML in `fixtures/` and run `pnpm scraper:dry`.

## Security
- Respects rate limiting and delays.
- No personal data stored.
