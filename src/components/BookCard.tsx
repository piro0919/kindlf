"use client";

import type { Book } from "@/lib/books";
import { openUrl } from "@/lib/books";
import { Cover } from "./Cover";

export function BookCard({ book }: { book: Book }) {
  return (
    <a href={openUrl(book.asin)} className="group flex flex-col gap-2 no-underline">
      <Cover asin={book.asin} title={book.title} />
      <span className="line-clamp-2 text-[13px] leading-snug">{book.title}</span>
    </a>
  );
}
