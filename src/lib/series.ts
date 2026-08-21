import type { Book } from "./books";

/**
 * 書名から巻数とレーベル表記を落として、シリーズ名を推測する。
 * Amazon の正式なシリーズ情報ではない。開示データにはどの巻がどの
 * シリーズに属するかの対応表が入っていないため、見た目から束ねている。
 */
const LABEL =
  /\s*[（(][^（(]*(コミック|COMIC|comics|文庫|新書|スペシャル|シリーズ|Japanese Edition)[^)）]*[)）]/gi;

const VOLUME = [
  /\s*[（(]\s*[0-9０-９]{1,3}\s*[)）]/g, // (1) （１）
  /\s*第?\s*[0-9０-９]{1,3}\s*[巻話]/g, // 1巻 第1話
  /\s+[0-9０-９]{1,3}\s*$/g, // 末尾の裸の数字
];

export function seriesName(title: string): string {
  let s = title.replace(LABEL, "");
  for (const pattern of VOLUME) s = s.replace(pattern, "");
  return s.replace(/^[　\s・\-—]+|[　\s・\-—]+$/g, "") || title;
}

export type Series = {
  name: string;
  books: Book[];
  /** 束の代表。並び順の鍵が一番新しい巻 */
  cover: Book;
};

export function groupBySeries(books: Book[]): Series[] {
  const map = new Map<string, Book[]>();
  for (const book of books) {
    const name = seriesName(book.title);
    const list = map.get(name);
    if (list) list.push(book);
    else map.set(name, [book]);
  }
  // books は並び替え済みなので、各束の先頭がそのまま代表になる
  return [...map].map(([name, list]) => ({ name, books: list, cover: list[0] }));
}
