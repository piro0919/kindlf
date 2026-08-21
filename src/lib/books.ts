import { del, get, set } from "idb-keyval";

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

// Kindle アプリに渡るかは未検証。駄目ならここを差し替える
export function openUrl(asin: string): string {
  return `https://read.amazon.co.jp/?asin=${asin}`;
}

export function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const d = recency(b).localeCompare(recency(a));
    return d !== 0 ? d : a.title.localeCompare(b.title, "ja");
  });
}

/** ASIN は10桁の英数字。書名以外が欠けていても、そこだけ補って通す */
export function parseBooks(input: unknown): Book[] {
  if (!Array.isArray(input))
    throw new Error("蔵書データの形が違います。本の配列が入ったファイルを選んでください");

  const books = input.flatMap((row): Book[] => {
    if (typeof row !== "object" || row === null) return [];
    const r = row as Record<string, unknown>;
    const asin = typeof r.asin === "string" ? r.asin.trim() : "";
    if (!/^[A-Z0-9]{10}$/i.test(asin)) return [];
    return [
      {
        asin,
        title: typeof r.title === "string" && r.title ? r.title : asin,
        author: typeof r.author === "string" ? r.author : "",
        acquired: typeof r.acquired === "string" ? r.acquired : "",
        lastRead: typeof r.lastRead === "string" ? r.lastRead : "",
      },
    ];
  });

  if (books.length === 0)
    throw new Error("読み込める本がありませんでした。ASIN が入っているか確かめてください");

  // 同じ ASIN が二度出てきたら後勝ち
  const unique = new Map(books.map((b) => [b.asin, b]));
  return sortBooks([...unique.values()]);
}

/** 取り込んだ蔵書。無ければ null。見本と区別するために null を返す */
export async function storedBooks(): Promise<Book[] | null> {
  const stored = await get<Book[]>(KEY);
  return stored?.length ? sortBooks(stored) : null;
}

/**
 * 開発中だけ、public に置いた books.json と見本を見に行く。
 * 公開したものは端末に取り込んだ蔵書しか読まない。
 */
export async function devBooks(): Promise<Book[] | null> {
  if (process.env.NODE_ENV !== "development") return null;
  for (const path of ["/books.json", "/books.example.json"]) {
    const res = await fetch(path).catch(() => null);
    if (res?.ok) return sortBooks(await res.json());
  }
  return null;
}

export async function saveBooks(books: Book[]): Promise<void> {
  await set(KEY, books);
}

export async function clearBooks(): Promise<void> {
  await del(KEY);
}
