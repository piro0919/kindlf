import { defaultCache } from "@serwist/next/worker";
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  type PrecacheEntry,
  Serwist,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * 画面そのものの控え。ネットワーク優先。
 * 打ち切りを短くすると、遅いだけの回線で控えに落ちる。画面は前もって
 * 控えてあるので、待たせるより控えを出すほうが速い場面もあるが、
 * 内容が古くなるのを避けたいので10秒待つ。
 */
const documentCache = {
  handler: new NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 16 })],
  }),
  matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }): boolean =>
    sameOrigin && request.mode === "navigate",
};

/**
 * 表紙。ASIN ごとに中身が変わらないので、一度取ったら使い回す。
 * 2000冊ぶん抱えるため上限を大きめに取り、30日で捨てる。
 */
const coverCache = {
  handler: new CacheFirst({
    cacheName: "covers",
    plugins: [
      // 別ドメインの画像は中身を読めない応答で返る。既定では保存されないので明示する
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60,
        maxEntries: 3000,
        purgeOnQuotaError: true,
      }),
    ],
  }),
  matcher: ({ url }: { url: URL }): boolean => url.hostname === "m.media-amazon.com",
};

const serwist = new Serwist({
  clientsClaim: true,
  /**
   * 控えも無く、取得にも失敗したときに出す画面。
   * ページの読み込みだけを差し替える。画像はそのまま失敗させる。
   */
  fallbacks: {
    entries: [
      {
        matcher: ({ request }): boolean => request.destination === "document",
        url: "/~offline",
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [documentCache, coverCache, ...defaultCache],
  skipWaiting: true,
});

serwist.addEventListeners();
