"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { devBooks, storedBooks } from "@/lib/books";
import { BookCard } from "./BookCard";

type State = { books: Book[] } | { books: null };

export function Shelf() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const books = (await storedBooks()) ?? (await devBooks());
      if (alive) setState({ books });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state === null) return null;

  if (state.books === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-5 py-20">
        <h2 className="text-lg font-bold">本棚が空です</h2>
        <p className="text-muted">
          Amazon から受け取った蔵書データを読み込むと、ここに表紙が並びます。
        </p>
        <Link
          href="/settings"
          className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg no-underline"
        >
          蔵書を読み込む
        </Link>
      </div>
    );
  }

  return (
    <main className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-[22px] gap-y-8 px-5 pt-6 pb-16">
      {state.books.map((book) => (
        <BookCard key={book.asin} book={book} />
      ))}
    </main>
  );
}
