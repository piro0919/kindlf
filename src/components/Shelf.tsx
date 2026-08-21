"use client";

import { useEffect, useMemo, useState } from "react";
import type { Book } from "@/lib/books";
import { loadBooks } from "@/lib/books";
import { groupBySeries, type Series } from "@/lib/series";
import { BookCard } from "./BookCard";
import { SeriesCard } from "./SeriesCard";

export function Shelf() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [term, setTerm] = useState("");
  const [grouped, setGrouped] = useState(false);
  const [opened, setOpened] = useState<Series | null>(null);

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  const matched = useMemo(() => {
    if (!books) return [];
    const q = term.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.title.toLowerCase().includes(q));
  }, [books, term]);

  const series = useMemo(
    () => (grouped ? groupBySeries(matched) : []),
    [grouped, matched],
  );

  const total = books?.length ?? 0;
  const showing = opened ? opened.books : matched;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 px-5 pt-3.5 pb-2.5 backdrop-blur-xl backdrop-saturate-150">
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpened(null); // 束を開いたまま絞り込むと迷子になる
          }}
          placeholder="タイトルで絞り込む"
          autoComplete="off"
          className="w-full appearance-none rounded-[10px] border border-line bg-black/6 px-3.5 py-2.5 text-base outline-none focus:outline-2 focus:-outline-offset-1 focus:outline-accent dark:bg-white/6"
        />
        <div className="mt-2.5 flex items-center gap-3 text-[13px] text-muted">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={grouped}
              onChange={(e) => {
                setGrouped(e.target.checked);
                setOpened(null);
              }}
              className="accent-accent"
            />
            シリーズをまとめる
          </label>
          <span className="tabular-nums">
            {opened
              ? `${opened.name} ${opened.books.length}冊`
              : grouped
                ? `${series.length} シリーズ`
                : `${matched.length} 冊${matched.length !== total ? ` / ${total}` : ""}`}
          </span>
          {opened && (
            <button
              type="button"
              onClick={() => setOpened(null)}
              className="ml-auto cursor-pointer rounded-full border border-line px-3 py-1"
            >
              閉じる
            </button>
          )}
        </div>
      </header>

      <main className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-[22px] gap-y-8 px-5 pt-6 pb-16">
        {books === null
          ? null
          : grouped && !opened
            ? series.map((s) => (
                <SeriesCard key={s.name} series={s} onOpen={setOpened} />
              ))
            : showing.map((b) => <BookCard key={b.asin} book={b} />)}
      </main>

      {books !== null && showing.length === 0 && !grouped && (
        <p className="px-5 py-16 text-center text-muted">該当する本がありません</p>
      )}
    </>
  );
}
