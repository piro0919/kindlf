import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description: "インターネットに接続されていないときに表示されるページです。",
  robots: { follow: false, index: false },
  title: "オフライン",
};

/**
 * 圏外で、まだ一度も開いていないページを開いたときの受け皿。
 * Service Worker が控えを持っていない場合にここへ差し替わる。
 */
export default function Page() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-5 py-16">
      <h2 className="text-lg font-bold">インターネットに接続されていません</h2>
      <p className="text-muted">
        このページは保存されていないため、オフラインでは表示できません。
        接続を確認してから、もう一度お試しください。
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg no-underline"
      >
        再試行
      </Link>
    </div>
  );
}
