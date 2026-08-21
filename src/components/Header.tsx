import Image from "next/image";
import Link from "next/link";
import { MdSettings } from "react-icons/md";
import { display } from "@/lib/fonts";
import { InstallButton } from "./InstallButton";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex h-(--header-height) items-center gap-3 border-b border-line bg-bg/88 px-4 backdrop-blur-lg sm:px-6">
      {/* 見出しではなく、どの画面からも戻れる帰り道 */}
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/icon-180.png"
          alt=""
          width={180}
          height={180}
          priority
          // 最適化を通すと /_next/image が挟まり、控えに無いぶんオフラインで欠ける
          unoptimized
          className="size-8 flex-none rounded-[0.55rem] border border-line object-cover"
        />
        <span className={`${display.className} text-[1.75rem] leading-none`}>
          Kindlf
        </span>
      </Link>
      {/* 題字の右端。出るものが無ければ何も見えない */}
      <div className="ms-auto flex items-center gap-2">
        <InstallButton />
        <Link
          href="/settings"
          aria-label="設定"
          className="flex size-9 items-center justify-center rounded-full text-muted"
        >
          <MdSettings className="text-xl" />
        </Link>
      </div>
    </header>
  );
}
