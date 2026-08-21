import { get, set } from "idb-keyval";

export type Book = {
  asin: string;
  title: string;
  author: string;
  /** 購入日。ISO8601 */
  acquired: string;
  /** 最後に開いた日。持っていない本もある */
  lastRead: string;
};

const KEY = "books";

/** 並び順の鍵。買った日と最後に開いた日の、新しいほう */
export function recency(book: Book): string {
  return book.lastRead > book.acquired ? book.lastRead : book.acquired;
}

export function coverUrl(asin: string): string {
  return `https://m.media-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg`;
}

// Kindle アプリに渡るかは iPad で未検証。駄目ならここを差し替える
export function openUrl(asin: string): string {
  return `https://read.amazon.co.jp/?asin=${asin}`;
}

function sorted(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const d = recency(b).localeCompare(recency(a));
    return d !== 0 ? d : a.title.localeCompare(b.title, "ja");
  });
}

/**
 * 蔵書を読む。端末に取り込んだものが正で、無ければ開発中の public/books.json、
 * それも無ければ同梱の見本を使う。蔵書データはサーバーに送らない。
 */
export async function loadBooks(): Promise<Book[]> {
  const stored = await get<Book[]>(KEY);
  if (stored?.length) return sorted(stored);

  for (const path of ["/books.json", "/books.example.json"]) {
    const res = await fetch(path).catch(() => null);
    if (res?.ok) return sorted(await res.json());
  }
  return [];
}

export async function saveBooks(books: Book[]): Promise<void> {
  await set(KEY, books);
}
