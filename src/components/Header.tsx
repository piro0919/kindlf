import Image from "next/image";
import Link from "next/link";
import { display } from "@/lib/fonts";

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
          className="size-8 flex-none rounded-[0.55rem] border border-line object-cover"
        />
        <span className={`${display.className} text-[1.75rem] leading-none`}>
          Kindlf
        </span>
      </Link>
    </header>
  );
}
