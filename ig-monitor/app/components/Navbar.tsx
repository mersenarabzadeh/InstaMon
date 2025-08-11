"use client";
import { useEffect, useState } from 'react';

export type NavbarProps = {
  handles: string[];
  initialWindow: 'trending' | '12h' | '24h';
  onChange: (state: { window: 'trending' | '12h' | '24h'; selectedHandles: string[] }) => void;
};

export function Navbar({ handles, initialWindow, onChange }: NavbarProps) {
  const [win, setWin] = useState(initialWindow);
  const [selected, setSelected] = useState<string[]>(handles);

  useEffect(() => {
    onChange({ window: win, selectedHandles: selected });
  }, [win, selected, onChange]);

  return (
    <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">IG Newsroom</h1>
          <select value={win} onChange={(e) => setWin(e.target.value as any)} className="rounded border px-2 py-1 text-sm">
            <option value="trending">Trending now</option>
            <option value="12h">Best 12h</option>
            <option value="24h">Best 24h</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {handles.map((h) => (
            <label key={h} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(h)}
                onChange={(e) => {
                  setSelected((prev) => (e.target.checked ? [...prev, h] : prev.filter((x) => x !== h)));
                }}
              />
              @{h}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}