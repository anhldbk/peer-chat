import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PeerChat — Open Source P2P Messaging",
  description: "PeerChat is an open source, free, peer-to-peer chat. No servers to store logs, no eavesdropping. Connect instantly with a 3-digit code.",
  keywords: ["p2p chat", "open source chat", "free chat", "peer-to-peer", "encrypted chat", "no server chat", "secure messaging", "webrtc chat"],
  authors: [{ name: "PeerChat" }],
  openGraph: {
    title: "PeerChat — Open Source P2P Messaging",
    description: "Free, open source peer-to-peer chat with zero server logging and complete privacy. Connect instantly.",
    type: "website",
    locale: "en_US",
    siteName: "PeerChat",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeerChat — Open Source P2P Messaging",
    description: "Free, open source peer-to-peer chat with zero server logging and complete privacy.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
