import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { body } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindlf",
  description: "Kindle の蔵書を自分の並びで開く本棚",
  applicationName: "Kindlf",
  appleWebApp: {
    capable: true,
    title: "Kindlf",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={body.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
