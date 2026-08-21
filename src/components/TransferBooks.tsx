"use client";

import { useEffect, useRef, useState } from "react";
import { MdCallMade, MdCallReceived } from "react-icons/md";
import { saveBooks, sortBooks, storedBooks } from "@/lib/books";
import { newCode, receive, send, type Session } from "@/lib/transfer";

type Step =
  | { kind: "idle" }
  | { kind: "sending"; code: string; percent: null | number }
  | { kind: "receiving"; code: string; percent: null | number }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/** 打ち込む側。6桁そろったら親に渡す */
function CodeInput({ onFilled }: { onFilled: (code: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6">
      <p className="text-sm text-muted">送る側に出ている6桁を入れてください</p>
      <input
        autoFocus
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, 6);

          setValue(next);

          if (next.length === 6) onFilled(next);
        }}
        className="w-48 rounded-xl border border-line bg-black/6 py-3 text-center font-mono text-3xl tracking-[0.3em] outline-none focus:outline-2 focus:-outline-offset-1 focus:outline-accent dark:bg-white/6"
      />
    </div>
  );
}

function Code({ code, note }: { code: string; note: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6">
      <div className="font-mono text-4xl tracking-[0.3em] tabular-nums">
        {code}
      </div>
      <p className="text-center text-sm text-muted">{note}</p>
    </div>
  );
}

function Progress({ percent }: { percent: number }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6">
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm tabular-nums text-muted">{percent}%</p>
    </div>
  );
}

/** 端末どうしで蔵書を渡す。合言葉の部屋で落ち合い、あとは直通 */
export function TransferBooks({ onChanged }: { onChanged: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const session = useRef<Session | null>(null);

  // 画面を離れたら部屋も畳む
  useEffect(
    () => () => {
      session.current?.close();
      session.current = null;
    },
    [],
  );

  function stop() {
    session.current?.close();
    session.current = null;
    setStep({ kind: "idle" });
  }

  function startSending() {
    void (async () => {
      const books = await storedBooks();

      if (books === null) {
        setStep({ kind: "error", message: "送る蔵書がこの端末にありません" });

        return;
      }

      const code = newCode();

      setStep({ kind: "sending", code, percent: null });
      session.current = send(code, books, {
        onPeer: () => setStep({ kind: "sending", code, percent: 0 }),
        onProgress: (percent) => setStep({ kind: "sending", code, percent }),
        onDone: () => {
          session.current?.close();
          session.current = null;
          setStep({ kind: "done", message: "送り終わりました" });
        },
        onError: (message) => setStep({ kind: "error", message }),
      });
    })();
  }

  function startReceiving(code: string) {
    setStep({ kind: "receiving", code, percent: null });
    session.current = receive(code, {
      onPeer: () => setStep({ kind: "receiving", code, percent: 0 }),
      onProgress: (percent) => setStep({ kind: "receiving", code, percent }),
      onDone: (books) => {
        void (async () => {
          await saveBooks(sortBooks(books));
          onChanged();
          session.current?.close();
          session.current = null;
          setStep({
            kind: "done",
            message: `${books.length.toLocaleString()} 冊を受け取りました`,
          });
        })();
      },
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-bold tracking-wide text-muted">
        別の端末とやり取り
      </h2>

      <div className="overflow-hidden rounded-2xl border border-line bg-black/3 dark:bg-white/4">
        {step.kind === "idle" && (
          <div className="flex">
            <button
              type="button"
              onClick={startSending}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 px-4 py-6"
            >
              <MdCallMade className="text-xl text-muted" />
              <span className="text-sm font-bold">送る</span>
            </button>
            <div className="w-px bg-line" />
            <button
              type="button"
              onClick={() => setStep({ kind: "receiving", code: "", percent: null })}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 px-4 py-6"
            >
              <MdCallReceived className="text-xl text-muted" />
              <span className="text-sm font-bold">受け取る</span>
            </button>
          </div>
        )}

        {step.kind === "sending" &&
          (step.percent === null ? (
            <Code code={step.code} note="受け取る側でこの数字を入れてください" />
          ) : (
            <Progress percent={step.percent} />
          ))}

        {step.kind === "receiving" &&
          (step.code === "" ? (
            <CodeInput onFilled={startReceiving} />
          ) : step.percent === null ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              相手を探しています…
            </p>
          ) : (
            <Progress percent={step.percent} />
          ))}

        {(step.kind === "sending" || step.kind === "receiving") && (
          <button
            type="button"
            onClick={stop}
            className="w-full cursor-pointer border-t border-line px-4 py-3 text-sm text-muted"
          >
            やめる
          </button>
        )}

        {(step.kind === "done" || step.kind === "error") && (
          <>
            <p
              className={`px-4 py-6 text-center text-sm ${
                step.kind === "error" ? "text-accent" : ""
              }`}
            >
              {step.message}
            </p>
            <button
              type="button"
              onClick={() => setStep({ kind: "idle" })}
              className="w-full cursor-pointer border-t border-line px-4 py-3 text-sm font-bold"
            >
              戻る
            </button>
          </>
        )}
      </div>
    </section>
  );
}
