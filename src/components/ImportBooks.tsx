"use client";

import { useEffect, useRef, useState } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
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
  const [dragging, setDragging] = useState(false);
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
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-bold tracking-wide text-muted">蔵書データ</h2>
        {count !== null && count > 0 && (
          <span className="text-[13px] text-muted tabular-nums">
            {count.toLocaleString()} 冊
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-black/3 dark:bg-white/4">
        {/*
          input を label で包む。iOS のホーム画面から起動した状態では
          button から click() を呼んでも開かないことがあるため、
          利用者の操作が直接 input に届く形にしている
        */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handle(file);
          }}
          className={`m-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-5 py-8 text-center transition-colors ${
            dragging ? "border-accent bg-accent/8" : "border-line"
          }`}
        >
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
          <MdOutlineFileUpload className="text-2xl text-muted" />
          <span className="text-sm font-bold">
            {status.kind === "reading" ? "読み込み中…" : "books.json を選ぶ"}
          </span>
        </label>

        {status.kind === "done" && (
          <p className="border-t border-line px-4 py-3 text-sm">
            {status.count.toLocaleString()} 冊を取り込みました
          </p>
        )}
        {status.kind === "error" && (
          <p className="border-t border-line px-4 py-3 text-sm text-accent">
            {status.message}
          </p>
        )}

        {!!count && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="text-sm text-muted">この端末から消す</span>
            <button
              type="button"
              className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[13px]"
              onClick={() => {
                void (async () => {
                  await clearBooks();
                  setCount(0);
                  setStatus({ kind: "idle" });
                })();
              }}
            >
              消す
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
