import { NextResponse } from 'next/server';
import { broadcastAlert } from '@/app/lib/alerts';

export async function POST() {
  await broadcastAlert('Test alert from IG monitor');
  return NextResponse.json({ ok: true });
}