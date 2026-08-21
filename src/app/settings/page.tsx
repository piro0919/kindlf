import type { Metadata } from "next";
import { Settings } from "@/components/Settings";

export const metadata: Metadata = {
  title: "設定",
  // 端末ごとの道具で、外から見て意味のある中身が無い
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Settings />;
}
