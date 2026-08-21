"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MdCallMade, MdCallReceived } from "react-icons/md";
import { saveBooks, sortBooks, storedBooks } from "@/lib/books";
import { startReceiving, startSending, type Receiver, type Sender } from "@/lib/transfer";

const QrScanner = dynamic(
  () => import("./QrScanner").then((m) => m.QrScanner),
  { ssr: false },
);

type Step =
  | { kind: "idle" }
  | { kind: "sending:show"; sender: Sender }
  | { kind: "sending:scan"; sender: Sender }
  | { kind: "sending:run"; percent: number }
  | { kind: "receiving:scan" }
  | { kind: "receiving:show"; receiver: Receiver }
  | { kind: "receiving:run"; size: number }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

function Code({ value, note }: { value: string; note: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="rounded-xl bg-white p-3">
        <QRCodeSVG value={value} size={224} level="L" />
      </div>
      <p className="text-center text-sm text-muted">{note}</p>
    </div>
  );
}

/** 端末どうしで蔵書を渡す。QR を2往復させてつなぐ */
export function TransferBooks({ onChanged }: { onChanged: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "idle" });

  const fail = useCallback((e: unknown) => {
    setStep({
      kind: "error",
      message: e instanceof Error ? e.message : "うまくいきませんでした",
    });
  }, []);

  const send = useCallback(async () => {
    try {
      const books = await storedBooks();

      if (books === null) {
        setStep({ kind: "error", message: "送る蔵書がこの端末にありません" });

        return;
      }

      const sender = await startSending(books, (sent, total) => {
        setStep({ kind: "sending:run", percent: Math.round((sent / total) * 100) });
      });

      setStep({ kind: "sending:show", sender });
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  const readAnswer = useCallback(
    (sender: Sender) => (answer: string) => {
      setStep({ kind: "sending:run", percent: 0 });
      sender
        .accept(answer)
        .then(() => setStep({ kind: "done", message: "送り終わりました" }))
        .catch(fail);
    },
    [fail],
  );

  const readOffer = useCallback(
    (offer: string) => {
      void (async () => {
        try {
          const receiver = await startReceiving(offer, (size) => {
            setStep({ kind: "receiving:run", size });
          });

          setStep({ kind: "receiving:show", receiver });

          const books = await receiver.receive();

          await saveBooks(sortBooks(books));
          onChanged();
          setStep({
            kind: "done",
            message: `${books.length.toLocaleString()} 冊を受け取りました`,
          });
        } catch (e) {
          fail(e);
        }
      })();
    },
    [fail, onChanged],
  );

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
              onClick={() => void send()}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 px-4 py-6"
            >
              <MdCallMade className="text-xl text-muted" />
              <span className="text-sm font-bold">送る</span>
            </button>
            <div className="w-px bg-line" />
            <button
              type="button"
              onClick={() => setStep({ kind: "receiving:scan" })}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 px-4 py-6"
            >
              <MdCallReceived className="text-xl text-muted" />
              <span className="text-sm font-bold">受け取る</span>
            </button>
          </div>
        )}

        {step.kind === "sending:show" && (
          <>
            <Code
              value={step.sender.offer}
              note="受け取る側の「受け取る」で、これを読んでください"
            />
            <button
              type="button"
              onClick={() => setStep({ kind: "sending:scan", sender: step.sender })}
              className="w-full cursor-pointer border-t border-line px-4 py-3 text-sm font-bold"
            >
              相手のQRを読む
            </button>
          </>
        )}

        {step.kind === "sending:scan" && (
          <QrScanner
            label="受け取る側に出ているQRを写してください"
            onRead={readAnswer(step.sender)}
            onCancel={() => setStep({ kind: "sending:show", sender: step.sender })}
          />
        )}

        {step.kind === "receiving:scan" && (
          <QrScanner
            label="送る側に出ているQRを写してください"
            onRead={readOffer}
            onCancel={() => setStep({ kind: "idle" })}
          />
        )}

        {step.kind === "receiving:show" && (
          <Code
            value={step.receiver.answer}
            note="送る側の「相手のQRを読む」で、これを読んでください"
          />
        )}

        {step.kind === "sending:run" && (
          <p className="px-4 py-6 text-center text-sm tabular-nums">
            送っています… {step.percent}%
          </p>
        )}

        {step.kind === "receiving:run" && (
          <p className="px-4 py-6 text-center text-sm tabular-nums">
            受け取っています… {Math.round(step.size / 1024)} KB
          </p>
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
