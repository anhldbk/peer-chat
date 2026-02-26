import Peer, { DataConnection } from "peerjs";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "peer";
  timestamp: number;
}

const CHARS = "0123456789";

export function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function createPeer(id: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peer = new Peer(id, {
      debug: 0,
    });

    peer.on("open", () => {
      resolve(peer);
    });

    peer.on("error", (err) => {
      reject(err);
    });
  });
}

export function connectToPeer(
  peer: Peer,
  remoteId: string
): Promise<DataConnection> {
  return new Promise((resolve, reject) => {
    const conn = peer.connect(remoteId, { reliable: true });

    conn.on("open", () => {
      resolve(conn);
    });

    conn.on("error", (err) => {
      reject(err);
    });

    // Timeout after 10s
    setTimeout(() => {
      reject(new Error("Connection timed out. Check the code and try again."));
    }, 10000);
  });
}

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
