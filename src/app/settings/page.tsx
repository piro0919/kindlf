import type { Metadata } from "next";
import { ImportBooks } from "@/components/ImportBooks";

export const metadata: Metadata = {
  title: "設定 - Kindlf",
};

export default function Page() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-5 py-8">
      <h1 className="text-xl font-bold">設定</h1>
      <ImportBooks />
      <p className="text-xs leading-relaxed text-muted">
        読み込んだ蔵書はこの端末の中だけに保存されます。どこにも送信しません。
        別の端末で使うときは、同じファイルをそちらでも読み込んでください。
      </p>
    </div>
  );
}
