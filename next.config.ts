import withSerwistInit from "@serwist/next";
import type { PluginOptions } from "@serwist/next";
import type { NextConfig } from "next";

/** オフライン画面の版。ビルドのたびに変え、古い控えを捨てさせる */
const offlineRevision = Date.now().toString(36);

/**
 * App Router のページは既定の一覧に入らない。
 * Kindlf の画面は静的で、中身は端末の中にある。だから画面ごと前もって控える。
 * 控えが無いまま通信に失敗すると、繋がっていてもオフライン画面に落ちてしまう。
 */
type ManifestTransform = NonNullable<PluginOptions["manifestTransforms"]>[number];

const PRECACHED_PAGES = ["/", "/settings", "/~offline"];

const manifestTransforms: ManifestTransform[] = [
  async (entries) => ({
    manifest: [
      ...entries,
      ...PRECACHED_PAGES.map((url) => ({ revision: offlineRevision, size: 0, url })),
    ],
    warnings: [],
  }),
];

const isDevelopment = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  disable: isDevelopment,
  manifestTransforms,
  swDest: "public/sw.js",
  swSrc: "src/app/sw.ts",
});

const baseConfig: NextConfig = {};

/**
 * 開発中は Serwist を止めている。それでも包むと webpack の設定だけが残り、
 * Turbopack で動かしたときに設定の食い違いとして警告が出る。だから包まない。
 */
export default isDevelopment ? baseConfig : withSerwist(baseConfig);
