"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MdInstallMobile } from "react-icons/md";
import { usePwa } from "use-pwa";

const PWAPrompt = dynamic(() => import("react-ios-pwa-prompt"), { ssr: false });

/** 端末の種類は変わらないので、購読しない */
const noopSubscribe = () => () => {};

/**
 * ホーム画面への追加を案内できる端末か。
 * iPad の Safari は Mac を名乗るため、触れる Mac も iPad とみなす。
 * react-ios-pwa-prompt 側の判定に合わせている。
 */
function isAppleDevice(): boolean {
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (ua.includes("macintosh") && window.navigator.maxTouchPoints > 1)
  );
}

/**
 * インストールの入り口。押したときだけ案内を出す。
 * Chrome 系はブラウザの確認、iOS は手順の案内を開く。
 */
export function InstallButton() {
  const { canInstall, install, isInstalled, isSupported } = usePwa();
  const [isGuideShown, setIsGuideShown] = useState(false);
  // サーバー側では判定できない。描画後に差し替わる
  const isApple = useSyncExternalStore(noopSubscribe, isAppleDevice, () => false);

  const canPrompt = isSupported && canInstall;

  if (isInstalled || (!canPrompt && !isApple)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (canPrompt) {
            void install();
            return;
          }
          setIsGuideShown(true);
        }}
        className="flex cursor-pointer items-center gap-1 rounded-full bg-accent px-3 py-2 text-[13px] font-bold whitespace-nowrap text-bg"
      >
        <MdInstallMobile className="text-base" />
        {/* 狭い画面では絵柄だけにする。題字の場所を削らないため */}
        <span className="max-[480px]:hidden">インストール</span>
      </button>
      {isApple && !canPrompt
        ? createPortal(
            <PWAPrompt
              appIconPath="/icon-180.png"
              copyAddToHomeScreenStep="2. [ホーム画面に追加] をタップします。"
              copyDescription="このサイトはアプリとして使用できます。ホーム画面に追加すると、全画面表示やオフラインでの利用が可能になります。"
              copyShareStep="1. 共有アイコン（四角から矢印が出たアイコン）をタップします。"
              copyTitle="ホーム画面に追加"
              delay={100}
              isShown={isGuideShown}
              onClose={() => setIsGuideShown(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}
