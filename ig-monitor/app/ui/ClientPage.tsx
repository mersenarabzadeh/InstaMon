"use client";
import useSWR from 'swr';
import { useCallback, useMemo, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ClientPage({ handles, initialWindow }: { handles: string[]; initialWindow: 'trending' | '12h' | '24h' }) {
  const [state, setState] = useState<{ window: 'trending' | '12h' | '24h'; selectedHandles: string[] }>({ window: initialWindow, selectedHandles: handles });
  const params = useMemo(() => {
    const p = new URLSearchParams();
    state.selectedHandles.forEach((h) => p.append('handle', h));
    return p;
  }, [state.selectedHandles]);

  const url = state.window === 'trending' ? `/api/trending?${params.toString()}` : `/api/top?window=${state.window}&${params.toString()}`;
  const { data, isLoading, error } = useSWR(url, fetcher, { refreshInterval: 60_000 });

  const items = data || [];

  return (
    <div>
      <Navbar handles={handles} initialWindow={initialWindow} onChange={setState} />
      <div className="mx-auto max-w-6xl p-4">
        {isLoading && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-72 animate-pulse rounded bg-gray-200" />))}</div>}
        {error && <p className="text-red-600">Failed to load.</p>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p: any) => {
              const age = formatAge(new Date(p.taken_at));
              return (
                <Card
                  key={p.permalink}
                  imageUrl={p.og_image_url}
                  handle={p.handle}
                  caption={p.caption || ''}
                  age={age}
                  interactions={p.interactions}
                  likes={p.likes || 0}
                  comments={p.comments || 0}
                  velocity={p.velocity}
                  ratio={p.velocity_ratio}
                  permalink={p.permalink}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAge(date: Date) {
  const mins = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m ago` : `${m}m ago`;
}