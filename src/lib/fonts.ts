import { Noto_Sans_JP, Outfit } from "next/font/google";

/** 本文。書名が日本語なので和文を持つものを選ぶ */
export const body = Noto_Sans_JP({ subsets: ["latin"], display: "swap" });

/** 題字だけに使う */
export const display = Outfit({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});
