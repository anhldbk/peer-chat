import Peer, { DataConnection } from "peerjs";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "peer";
  timestamp: number;
}

const CHARS = "0123456789";
export const NETWORK_NAMESPACE = "pc-msg-v1-";

export function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function createPeer(id: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    // Prefix ID to prevent global namespace collisions on the default PeerJS server
    const networkId = `${NETWORK_NAMESPACE}${id}`;
    const peer = new Peer(networkId, {
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
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
    // Remove { reliable: true } as WebRTC data channels are reliable by default 
    // and PeerJS's reliable shim can cause issues on certain browsers like Kindle's Chrome 80.
    const networkId = `${NETWORK_NAMESPACE}${remoteId}`;
    const conn = peer.connect(networkId);

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
