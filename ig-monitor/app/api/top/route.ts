import { NextRequest, NextResponse } from 'next/server';
import { bestOf } from '@/app/lib/metrics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const windowParam = searchParams.get('window');
  const handles = searchParams.getAll('handle');

  const hours = windowParam === '24h' ? 24 : 12;
  const rows = await bestOf(hours, handles.length ? handles : undefined);

  return NextResponse.json(
    rows.map((r) => ({
      handle: r.handle,
      permalink: r.permalink,
      caption: r.caption,
      taken_at: r.takenAt,
      likes: r.likes,
      comments: r.comments,
      interactions: r.interactions,
      og_image_url: r.ogImageUrl,
    }))
  );
}