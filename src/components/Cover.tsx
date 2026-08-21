"use client";

import { coverUrl } from "@/lib/books";

type Props = { asin: string; title: string; count?: number };

export function Cover({ asin, title, count }: Props) {
  return (
    <span className="relative block">
      {/* 表紙は Amazon の CDN から直接。こちらでは複製しない */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl(asin)}
        alt=""
        loading="lazy"
        decoding="async"
        className="aspect-2/3 w-full rounded-xs bg-black/8 object-cover shadow-[0_1px_2px_rgba(0,0,0,.18),0_8px_18px_rgba(0,0,0,.14)] transition group-active:translate-y-px group-active:scale-[.985] dark:bg-white/10"
      />
      {count !== undefined && count > 1 && (
        <span className="absolute right-1.5 bottom-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums">
          {count}
        </span>
      )}
      <span className="sr-only">{title}</span>
    </span>
  );
}
