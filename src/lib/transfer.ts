import { joinRoom, type Room } from "trystero";
import type { Book } from "./books";

/**
 * 端末どうしを直接つないで蔵書を渡す。
 *
 * 相手を見つけるところだけ Trystero に任せる。既定の Nostr の公開リレーに
 * 「この合言葉の部屋にいる」とだけ書き、見つかったら端末間の直通に切り替わる。
 * 蔵書はリレーを通らず、暗号化されて直接流れる。
 *
 * 合言葉は部屋の名前と共有秘密の両方に使う。名前だけだとリレーの運営者に
 * 鍵を復元されうる、と Trystero 自身が断っている。
 */

const APP_ID = "kindlf";
const NAMESPACE = "books";

/**
 * 相手を見つけるのに使うリレー。
 *
 * Trystero の既定の一覧をそのまま使うと、証明書切れ・到達不能・502 が混じり、
 * 生きている relay.damus.io も「投稿が多すぎる」と弾いてくる。
 * 2026-08-22 に実際に繋がったものだけを並べてある。落ちたら差し替える。
 */
const RELAYS = [
  "wss://purplerelay.com",
  "wss://relay.notoshi.win",
  "wss://relay.nostr.place",
  "wss://relay.mostr.pub",
  "wss://schnorr.me",
  "wss://staging.yabu.me",
  "wss://nos.lol",
  "wss://nostr.data.haus",
];

/** 打ちやすさを優先して6桁。部屋は画面を閉じれば消える */
export function newCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(6))]
    .map((n) => n % 10)
    .join("");
}

function open(code: string): Room {
  return joinRoom(
    {
      appId: APP_ID,
      password: code,
      relayConfig: { urls: RELAYS, redundancy: RELAYS.length },
    },
    `shelf-${code}`,
  );
}

export type Session = { close: () => void };

export type SendHandlers = {
  onPeer: () => void;
  onProgress: (percent: number) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

/** 蔵書を渡す側。相手が部屋に入ってきたら送り始める */
export function send(
  code: string,
  books: Book[],
  handlers: SendHandlers,
): Session {
  const room = open(code);
  const action = room.makeAction<Book[]>(NAMESPACE);

  room.onPeerJoin = (peerId) => {
    handlers.onPeer();

    // 分割も流量調整も Trystero 側がやる
    action
      .send(books, {
        target: peerId,
        onProgress: (percent) => handlers.onProgress(Math.round(percent * 100)),
      })
      .then(() => handlers.onDone())
      .catch(() => handlers.onError("送れませんでした"));
  };

  return { close: () => void room.leave() };
}

export type ReceiveHandlers = {
  onPeer: () => void;
  onProgress: (percent: number) => void;
  onDone: (books: Book[]) => void;
};

/** 蔵書を受け取る側。相手が入ってくるのを待って、届いたら渡す */
export function receive(code: string, handlers: ReceiveHandlers): Session {
  const room = open(code);
  const action = room.makeAction<Book[]>(NAMESPACE);

  room.onPeerJoin = () => handlers.onPeer();
  action.onReceiveProgress = (percent) =>
    handlers.onProgress(Math.round(percent * 100));
  action.onMessage = (books) => handlers.onDone(books);

  return { close: () => void room.leave() };
}
