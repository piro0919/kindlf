import type { Book } from "./books";

/**
 * 端末どうしを直接つないで蔵書を渡す。
 *
 * 信号のやり取りに中継サーバーを置かない。置けば接続情報が外部を通り、
 * 「蔵書は端末から出ない」という前提が崩れる。代わりに QR を2往復させる。
 *
 *   送る側が申し出のQRを出す → 受け取る側が読む
 *   受け取る側が返事のQRを出す → 送る側が読む → つながる
 *
 * 同じ回線にいれば、経路も宅内で閉じる。
 */

const CHUNK = 16 * 1024; // DataChannel が一度に扱える現実的な大きさ
const DONE = ""; // 送り終わりの合図

async function toCode(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const zipped = await new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  let binary = "";
  for (const b of new Uint8Array(zipped)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function fromCode(code: string): Promise<string> {
  const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new Response(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
  ).text();
}

/** ICE の収集が終わるまで待つ。途中の SDP を渡すと相手が繋ぎ先を知れない */
function gathered(peer: RTCPeerConnection): Promise<void> {
  if (peer.iceGatheringState === "complete") return Promise.resolve();

  return new Promise((resolve) => {
    const check = (): void => {
      if (peer.iceGatheringState === "complete") {
        peer.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };

    peer.addEventListener("icegatheringstatechange", check);
    // 収集が終わらない回線もある。手元の候補だけで諦める
    setTimeout(resolve, 3000);
  });
}

/** 宅内で完結させたいので、外の STUN は使わない */
function newPeer(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: [] });
}

export type Sender = {
  /** 受け取る側に読ませるQRの中身 */
  offer: string;
  /** 相手のQRを読んだら渡す。つながって送り終わるまで待つ */
  accept: (answer: string) => Promise<void>;
  close: () => void;
};

export async function startSending(
  books: Book[],
  onProgress: (sent: number, total: number) => void,
): Promise<Sender> {
  const peer = newPeer();
  const channel = peer.createDataChannel("books");

  channel.bufferedAmountLowThreshold = CHUNK * 4;

  await peer.setLocalDescription(await peer.createOffer());
  await gathered(peer);

  return {
    offer: await toCode(JSON.stringify(peer.localDescription)),
    close: () => peer.close(),
    accept: async (answer) => {
      await peer.setRemoteDescription(JSON.parse(await fromCode(answer)));

      await new Promise<void>((resolve, reject) => {
        channel.onerror = () => reject(new Error("接続が切れました"));
        channel.onopen = () => {
          void (async () => {
            const payload = JSON.stringify(books);

            for (let at = 0; at < payload.length; at += CHUNK) {
              // 送り込みすぎると詰まる。掃けるまで待つ
              if (channel.bufferedAmount > CHUNK * 8) {
                await new Promise<void>((next) => {
                  channel.onbufferedamountlow = () => next();
                });
              }

              channel.send(payload.slice(at, at + CHUNK));
              onProgress(Math.min(at + CHUNK, payload.length), payload.length);
            }

            channel.send(DONE);
            resolve();
          })();
        };
      });
    },
  };
}

export type Receiver = {
  /** 送る側に読ませるQRの中身。相手の申し出を読んでから作られる */
  answer: string;
  /** 蔵書が届くまで待つ */
  receive: () => Promise<Book[]>;
  close: () => void;
};

export async function startReceiving(
  offer: string,
  onProgress: (received: number) => void,
): Promise<Receiver> {
  const peer = newPeer();

  await peer.setRemoteDescription(JSON.parse(await fromCode(offer)));
  await peer.setLocalDescription(await peer.createAnswer());
  await gathered(peer);

  return {
    answer: await toCode(JSON.stringify(peer.localDescription)),
    close: () => peer.close(),
    receive: () =>
      new Promise<Book[]>((resolve, reject) => {
        peer.ondatachannel = ({ channel }) => {
          const parts: string[] = [];
          let size = 0;

          channel.onmessage = ({ data }: MessageEvent<string>) => {
            if (data === DONE) {
              try {
                resolve(JSON.parse(parts.join("")) as Book[]);
              } catch {
                reject(new Error("受け取った蔵書を読めませんでした"));
              }

              return;
            }

            parts.push(data);
            size += data.length;
            onProgress(size);
          };

          channel.onerror = () => reject(new Error("接続が切れました"));
        };
      }),
  };
}
