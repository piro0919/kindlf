"use client";

import type { Series } from "@/lib/series";
import { Cover } from "./Cover";

type Props = { series: Series; onOpen: (series: Series) => void };

export function SeriesCard({ series, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(series)}
      className="group flex cursor-pointer flex-col gap-2 text-left"
    >
      <Cover asin={series.cover.asin} title={series.name} count={series.books.length} />
      <span className="line-clamp-2 text-[13px] leading-snug">{series.name}</span>
    </button>
  );
}
