import { ImageResponse } from "next/og";

export const alt = "Kindlf";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 共有されたときに出る画像。題字と一言だけ */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#16151a",
          color: "#ece9e4",
        }}
      >
        {/* アイコンと同じ、棚に並んだ背表紙 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          <div style={{ width: 46, height: 132, background: "#b4642a" }} />
          <div style={{ width: 46, height: 158, background: "#d98f4f" }} />
          <div style={{ width: 46, height: 118, background: "#e8dfd2" }} />
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>Kindlf</div>
        <div style={{ fontSize: 34, color: "#8d8781" }}>
          Your Kindle library, laid out your way
        </div>
      </div>
    ),
    size,
  );
}
