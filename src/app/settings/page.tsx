import type { Metadata } from "next";
import { ImportBooks } from "@/components/ImportBooks";

export const metadata: Metadata = {
  title: "設定 - Kindlf",
};

export default function Page() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-7 px-5 py-8">
      <h1 className="text-2xl font-bold">設定</h1>
      <ImportBooks />
    </div>
  );
}
