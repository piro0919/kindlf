import { unzip, type Unzipped } from "fflate";
import { sortBooks, type Book } from "./books";

/**
 * Amazon の「データのリクエスト」で届く Kindle.zip から蔵書を取り出す。
 *
 * 中身は15,000を超えるファイルだが、要るのは2か所だけ。
 *
 *   Digital.Content.Ownership/*.json  1冊1ファイルの所有記録
 *   Digital.Content.Whispersync/whispersync.csv  最後に開いた日時
 *
 * scripts/import-ownership.py と同じ絞り込みをする。片方だけ直すと
 * 手元で作った books.json と結果がずれるので、条件は揃えておくこと。
 */

const OWNERSHIP = "Digital.Content.Ownership/";
const WHISPERSYNC = "Digital.Content.Whispersync/whispersync.csv";

const WANT_TYPE = "KindleEBook";
const WANT_ORIGIN = "Purchase"; // Kindle Unlimited と Prime は読み終われば権利が消える
const WANT_STATUS = "Active";

/** 書名の末尾に付く言語表記 */
const TRAILING = /\s*\((?:Japanese|English|German|French|Spanish) Edition\)\s*$/;

type Ownership = {
  resource?: { resourceType?: string; ASIN?: string; "Product Name"?: string };
  rights?: {
    origin?: { originType?: string };
    rightStatus?: string;
    acquiredDate?: string;
  }[];
};

/** ASIN → 最後に開いた日時。Whispersync は端末をまたいで記録が残る */
function lastReadOf(csv: string): Map<string, string> {
  const rows = csv.split(/\r?\n/);
  const header = rows[0]?.replace(/^﻿/, "").split(",") ?? [];
  const asinAt = header.indexOf("ASIN");
  const updatedAt = header.indexOf("LastUpdatedDate");
  const seen = new Map<string, string>();

  if (asinAt < 0 || updatedAt < 0) return seen;

  for (const row of rows.slice(1)) {
    // 引用符の中にカンマを含む列があるので、素朴な分割はしない
    const cells = row.match(/("[^"]*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0) ?? [];
    const asin = cells[asinAt]?.replace(/^"|"$/g, "");
    const date = cells[updatedAt]?.replace(/^"|"$/g, "");

    if (!asin || asin === "Not Available") continue;
    if (!date || date === "Not Available") continue;
    if (date > (seen.get(asin) ?? "")) seen.set(asin, date);
  }

  return seen;
}

function pick(record: Ownership, lastRead: Map<string, string>): Book | null {
  const resource = record.resource;

  if (resource?.resourceType !== WANT_TYPE) return null;

  const asin = resource.ASIN;

  if (!asin) return null;

  for (const right of record.rights ?? []) {
    if (right.origin?.originType !== WANT_ORIGIN) continue;
    if (right.rightStatus !== WANT_STATUS) continue;

    return {
      asin,
      title: (resource["Product Name"] ?? asin).replace(TRAILING, "").trim(),
      author: "", // 開示データに著者は入っていない
      acquired: right.acquiredDate ?? "",
      lastRead: lastRead.get(asin) ?? "",
    };
  }

  return null;
}

/** zip を丸ごと展開せず、要る2か所だけ取り出す */
function open(file: File): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    void file.arrayBuffer().then((buffer) => {
      unzip(
        new Uint8Array(buffer),
        {
          filter: ({ name }) =>
            (name.startsWith(OWNERSHIP) && name.endsWith(".json")) ||
            name === WHISPERSYNC,
        },
        (error, unzipped) =>
          error ? reject(new Error("zip を開けませんでした")) : resolve(unzipped),
      );
    }, reject);
  });
}

export async function booksFromZip(
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<Book[]> {
  const unzipped = await open(file);
  const names = Object.keys(unzipped);
  const decoder = new TextDecoder();

  const whispersync = unzipped[WHISPERSYNC];
  const lastRead = whispersync ? lastReadOf(decoder.decode(whispersync)) : new Map();

  const owned = names.filter((name) => name.startsWith(OWNERSHIP));

  if (owned.length === 0) {
    throw new Error("Kindle.zip ではないようです。中身を確かめてください");
  }

  const found = new Map<string, Book>();

  for (const [at, name] of owned.entries()) {
    try {
      const book = pick(
        JSON.parse(decoder.decode(unzipped[name])) as Ownership,
        lastRead,
      );

      if (book && !found.has(book.asin)) found.set(book.asin, book);
    } catch {
      // 壊れた1ファイルで全体を止めない
    }

    // 1万件を超える。毎回知らせると描画のほうが重くなる
    if (at % 500 === 0) {
      onProgress(at, owned.length);
      await new Promise((next) => setTimeout(next, 0));
    }
  }

  onProgress(owned.length, owned.length);

  if (found.size === 0) {
    throw new Error("購入した本が見つかりませんでした");
  }

  return sortBooks([...found.values()]);
}
