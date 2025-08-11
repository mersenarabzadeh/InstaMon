"use client";
import Image from 'next/image';
import { useEffect, useState } from 'react';

export type CardProps = {
  imageUrl: string;
  handle: string;
  caption: string;
  age: string;
  interactions: number;
  likes: number;
  comments: number;
  velocity?: number;
  ratio?: number;
  permalink: string;
};

export function Card({ imageUrl, handle, caption, age, interactions, likes, comments, velocity, ratio, permalink }: CardProps) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const key = `seen:${permalink}`;
    if (!localStorage.getItem(key)) {
      setSeen(true);
      localStorage.setItem(key, '1');
    }
  }, [permalink]);
  return (
    <a href={permalink} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-lg border bg-white shadow hover:shadow-lg focus:outline-none focus:ring">
      <div className="relative aspect-square w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={caption || handle} className="h-full w-full object-cover" />
        {seen && (<span className="absolute left-2 top-2 rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">New since last visit</span>)}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">@{handle}</span>
          <span className="text-xs text-gray-500">{age}</span>
        </div>
        <p className="line-clamp-2 text-sm text-gray-800">{caption}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
          <span>❤️ {likes.toLocaleString()}</span>
          <span>💬 {comments.toLocaleString()}</span>
          <span>↕️ {interactions.toLocaleString()}</span>
          {velocity !== undefined && ratio !== undefined && (
            <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] text-amber-800">v={velocity.toFixed(2)} r={ratio.toFixed(2)}</span>
          )}
        </div>
      </div>
    </a>
  );
}