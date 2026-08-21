import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/Header";
import { body } from "@/lib/fonts";
import "./globals.css";

const APP_NAME = "Kindlf";
const APP_DESCRIPTION =
  "Kindle の蔵書を、自分の並びで開ける本棚です。ホーム画面に入れると全画面で開き、蔵書は端末の中だけに保存されます。";

export const metadata: Metadata = {
  metadataBase: new URL("https://kindlf.kkweb.io"),
  title: { default: APP_NAME, template: `%s - ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: { default: APP_NAME, template: `%s - ${APP_NAME}` },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: { default: APP_NAME, template: `%s - ${APP_NAME}` },
    description: APP_DESCRIPTION,
  },
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
        <Analytics />
      </body>
    </html>
  );
}
