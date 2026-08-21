import { del, get, set } from "idb-keyval";

export type Book = {
  asin: string;
  title: string;
  author: string;
  /** 購入日。ISO8601 */
  acquired: string;
  /** 最後に開いた日。持っていない本もある */
  lastRead: string;
  /** 漫画か。開示データのジャンルから決める。飛び先を分けるのに使う */
  manga: boolean;
};

const KEY = "books";

/** 並び順の鍵。買った日と最後に開いた日の、新しいほう */
export function recency(book: Book): string {
  return book.lastRead > book.acquired ? book.lastRead : book.acquired;
}

export function coverUrl(asin: string): string {
  return `https://m.media-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg`;
}

/**
 * Web リーダーの入り口。Android では Kindle アプリに渡せない。
 * https の5通りも intent:// の2通りも駄目で、intent は Play ストアに飛ばされる。
 *
 * 漫画は `/manga/` のほうが読みやすい。ただし文字ものをそこへ送ると開けないので、
 * 開示データのジャンルで振り分ける。判断がつかない本は `?asin=` に寄せる。
 * こちらはどの本でも開くことを実機で確認している。
 */
export function openUrl(book: Pick<Book, "asin" | "manga">): string {
  return book.manga
    ? `https://read.amazon.co.jp/manga/${book.asin}`
    : `https://read.amazon.co.jp/?asin=${book.asin}`;
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
        manga: r.manga === true,
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
