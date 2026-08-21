/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://kindlf.kkweb.io/",
  generateRobotsTxt: true,
  // 圏外のときだけ出る画面、端末ごとの道具、ページではないもの
  exclude: [
    "/~offline",
    "/settings",
    "/opentest",
    "/manifest.webmanifest",
    "/opengraph-image",
  ],
};

module.exports = config;
