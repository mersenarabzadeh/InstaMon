import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import '@/app/lib/scheduler';

export async function GET() {
  try {
    const latest = await prisma.igMetric.findFirst({ orderBy: { ts: 'desc' } });
    const lastTs = latest?.ts ? new Date(latest.ts).getTime() : 0;
    const ok = Date.now() - lastTs < 20 * 60 * 1000;
    return NextResponse.json({ ok });
  } catch (e) {
    return NextResponse.json({ ok: false });
  }
}