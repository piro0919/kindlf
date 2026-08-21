"use client";

import { useEffect, useRef, useState } from "react";
import { clearBooks, parseBooks, saveBooks, storedBooks } from "@/lib/books";

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "done"; count: number }
  | { kind: "error"; message: string };

/** 端末に取り込む。ファイルはこの中だけで読み、どこにも送らない */
export function ImportBooks() {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void storedBooks().then((books) => {
      if (alive) setCount(books?.length ?? 0);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handle(file: File) {
    setStatus({ kind: "reading" });
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        // 解析器の生の文言は読み手の役に立たない
        throw new Error("JSON として読めませんでした。ファイルを確かめてください");
      }
      const books = parseBooks(parsed);
      await saveBooks(books);
      setCount(books.length);
      setStatus({ kind: "done", count: books.length });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "読み込めませんでした",
      });
    } finally {
      // 同じファイルをもう一度選んでも反応するように空にしておく
      if (input.current) input.current.value = "";
    }
  }

  return (
    <section className="flex flex-col items-start gap-4">
      <div>
        <h2 className="text-base font-bold">蔵書データ</h2>
        <p className="mt-1 text-sm text-muted">
          {count === null
            ? "\u00a0"
            : count > 0
              ? `${count.toLocaleString()} 冊がこの端末に入っています`
              : "まだ何も入っていません"}
        </p>
      </div>

      {/*
        input を label で包む。iOS のホーム画面から起動した状態では
        button から click() を呼んでも開かないことがあるため、
        利用者の操作が直接 input に届く形にしている
      */}
      <label className="cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg">
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handle(file);
          }}
        />
        {count ? "読み込み直す" : "books.json を選ぶ"}
      </label>

      {status.kind === "reading" && <p className="text-sm text-muted">読み込み中…</p>}
      {status.kind === "done" && (
        <p className="text-sm">
          {status.count.toLocaleString()} 冊を取り込みました
        </p>
      )}
      {status.kind === "error" && (
        <p className="text-sm text-accent">{status.message}</p>
      )}

      {!!count && (
        <button
          type="button"
          className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm text-muted"
          onClick={() => {
            void (async () => {
              await clearBooks();
              setCount(0);
              setStatus({ kind: "idle" });
            })();
          }}
        >
          この端末から消す
        </button>
      )}
    </section>
  );
}
