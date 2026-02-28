# PeerChat — Open Source P2P Messaging

PeerChat is an open source, free, peer-to-peer chat. No servers to store logs, no eavesdropping. Just share a 3-digit code or scan a QR code and start chatting.

Built with WebRTC via [PeerJS](https://peerjs.com/), messages and files travel directly between browsers. Nothing is stored anywhere.

## ✨ Features

- **Zero friction** — open the page, share your code, connect.
- **3-digit codes** — no copying long UUIDs, just tell your friend "472".
- **QR Code Connect** — scan a session's QR code from your mobile device to instantly connect.
- **File & Image Sharing** — natively send images with inline previews, or transfer any file type directly peer-to-peer securely.
- **Truly peer-to-peer** — messages and high-speed file transfers go directly between browsers via WebRTC DataChannels.
- **Premium Responsive UI** — a beautiful, responsive dark-mode aesthetic featuring glassmorphism cards and smooth micro-animations. Fully optimized for mobile screens.
- **Zero logging** — no backend database, complete privacy.

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/your-username/peer-chat.git
cd peer-chat
npm install

# Run locally
npm run dev
```

Open two browser tabs at `http://localhost:3000`. One tab shows your code — enter it or scan the QR code in the other tab to connect.

## 🏗️ Tech Stack

| Tech | Role |
|---|---|
| [Next.js](https://nextjs.org/) | Framework (static export) |
| [PeerJS](https://peerjs.com/) | WebRTC abstraction |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |

## 📦 Deploy

The app is configured for static export. Build and deploy the `out/` directory to any static file host like Netlify, Vercel, or GitHub Pages.

```bash
npm run build   # → outputs to out/
```

## 📁 Project Structure

```
app/
├── components/
│   ├── ChatApp.tsx      # Main state machine (lobby → chat)
│   ├── ChatView.tsx     # Message bubbles, file previews & input
│   └── Lobby.tsx        # Token display, QR tabs & connect form
├── lib/
│   └── peer.ts          # PeerJS helpers & payload generation
├── globals.css          # Premium glassmorphism styles
├── layout.tsx           # SEO Metadata & Root layout
└── page.tsx             # Entry point
```

## 🔒 Privacy

- Messages and files are **not** routed through any server — they go directly between your devices via WebRTC securely.
- PeerJS's public signaling server is *only* used for the initial handshake (exchanging network info).
- No data is stored, logged, or persisted anywhere.
- Closing the tab destroys the connection and all transferred session data instantly.

## 📄 License

MIT
