import withSerwistInit from "@serwist/next";
import type { PluginOptions } from "@serwist/next";
import type { NextConfig } from "next";

/** オフライン画面の版。ビルドのたびに変え、古い控えを捨てさせる */
const offlineRevision = Date.now().toString(36);

/**
 * App Router のページは既定の一覧に入らない。
 * オフライン画面だけは前もって控えておかないと、いざというときに出せない。
 */
type ManifestTransform = NonNullable<PluginOptions["manifestTransforms"]>[number];

const manifestTransforms: ManifestTransform[] = [
  async (entries) => ({
    manifest: [...entries, { revision: offlineRevision, size: 0, url: "/~offline" }],
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
