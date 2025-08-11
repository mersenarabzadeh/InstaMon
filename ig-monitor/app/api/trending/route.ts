import { NextRequest, NextResponse } from 'next/server';
import { trendingNow } from '@/app/lib/metrics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handles = searchParams.getAll('handle');
  const rows = await trendingNow(handles.length ? handles : undefined);

  return NextResponse.json(
    rows.map((r) => ({
      handle: r.handle,
      permalink: r.permalink,
      taken_at: r.takenAt,
      interactions: r.interactions,
      minutes_since_publish: r.minutesSincePublish,
      velocity: r.velocity,
      velocity_ratio: r.velocityRatio,
      og_image_url: r.ogImageUrl,
    }))
  );
}