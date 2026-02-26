# PeerChat

Instant peer-to-peer messaging in your browser. No servers, no accounts, no sign-up — just share a 3-digit code and start chatting.

Built with WebRTC via [PeerJS](https://peerjs.com/), messages travel directly between browsers. Nothing is stored anywhere.

## ✨ Features

- **Zero friction** — open the page, share your code, connect
- **3-digit codes** — no copying long UUIDs, just tell your friend "472"
- **Truly peer-to-peer** — messages go directly between browsers via WebRTC DataChannel
- **No backend** — static site, deploy anywhere (Netlify, Vercel, GitHub Pages)
- **E-ink friendly** — optimized for Kindle Scribe and similar e-ink devices

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/your-username/peer-chat.git
cd peer-chat
npm install

# Run locally
npm run dev
```

Open two browser tabs at `http://localhost:3000`. One tab shows your code — enter it in the other tab to connect.

## 🏗️ Tech Stack

| Tech | Role |
|---|---|
| [Next.js](https://nextjs.org/) | Framework (static export) |
| [PeerJS](https://peerjs.com/) | WebRTC abstraction |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |

## 📦 Deploy

The app is configured for static export. Build and deploy the `out/` directory to any static host:

```bash
npm run build   # → outputs to out/
```

### Netlify

A `netlify.toml` is included. Just connect your repo — it works out of the box.

### Other Hosts

Upload the `out/` directory to any static file host (GitHub Pages, Cloudflare Pages, S3, etc.).

## 🖥️ E-Ink / Kindle Scribe Support

The UI is designed for e-ink displays:

- High-contrast black & white palette (no colors/gradients)
- All CSS animations and transitions disabled to prevent ghosting
- Large touch targets (≥ 48px) for imprecise e-ink taps
- No `backdrop-filter` or blur effects
- Font antialiasing disabled for maximum crispness

See [`docs/browser.md`](docs/browser.md) for detailed Kindle Scribe browser capabilities.

## 📁 Project Structure

```
app/
├── components/
│   ├── ChatApp.tsx      # Main state machine (lobby → chat)
│   ├── ChatView.tsx     # Message bubbles & input
│   └── Lobby.tsx        # Code display & connect form
├── lib/
│   └── peer.ts          # PeerJS helpers & code generation
├── globals.css          # E-ink optimized styles
├── layout.tsx           # Root layout
└── page.tsx             # Entry point
```

## 🔒 Privacy

- Messages are **not** routed through any server — they go directly between browsers via WebRTC
- PeerJS's public signaling server is only used for the initial handshake (exchanging network info)
- No data is stored, logged, or persisted anywhere
- Closing the tab destroys the connection and all messages

## 📄 License

MIT
