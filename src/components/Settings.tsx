"use client";

import Link from "next/link";
import { useState } from "react";
import { ImportBooks } from "./ImportBooks";
import { TransferBooks } from "./TransferBooks";

export function Settings() {
  // 受け取ったあとに冊数を出し直させる
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-7 px-5 py-8">
      <h1 className="text-2xl font-bold">設定</h1>
      <ImportBooks reloadKey={reloadKey} />
      <TransferBooks onChanged={() => setReloadKey((n) => n + 1)} />
      {/* 飛び先を決めるための実験台。決まったら消す */}
      <Link href="/opentest" className="text-xs text-muted underline">
        本の開き方を試す
      </Link>
    </div>
  );
}
