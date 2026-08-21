"use client";

import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { loadBooks } from "@/lib/books";
import { BookCard } from "./BookCard";

export function Shelf() {
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  return (
    <main className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-[22px] gap-y-8 px-5 pt-6 pb-16">
      {books?.map((book) => (
        <BookCard key={book.asin} book={book} />
      ))}
    </main>
  );
}
