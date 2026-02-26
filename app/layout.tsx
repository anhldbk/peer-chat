import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PeerChat — P2P Messaging",
  description: "Instant peer-to-peer messaging with short codes. No servers, no sign-up, end-to-end encrypted via WebRTC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {/* Pre-React error handler for Kindle/Chrome 80 debugging */}
        <script dangerouslySetInnerHTML={{
          __html: `
          window.onerror = function(msg, url, line, col, err) {
            var d = document.getElementById('_dbg');
            if (!d) {
              d = document.createElement('div');
              d.id = '_dbg';
              d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#000;padding:20px;font:13px/1.6 monospace;overflow:auto;z-index:99999;white-space:pre-wrap;word-break:break-all';
              d.innerHTML = '<b style="font-size:18px">PeerChat Debug</b><hr>';
              document.body.appendChild(d);
            }
            d.innerHTML += '\\nERROR: ' + msg + '\\nFile: ' + url + ':' + line + ':' + col + '\\n';
            if (err && err.stack) d.innerHTML += 'Stack: ' + err.stack.substring(0, 500) + '\\n';
            d.innerHTML += '---\\n';
            var ls = document.querySelector('.init-screen');
            if (ls) ls.style.display = 'none';
          };
          window.addEventListener('unhandledrejection', function(e) {
            window.onerror('Unhandled: ' + e.reason, '', 0, 0, e.reason instanceof Error ? e.reason : null);
          });
        `}} />
        {children}
      </body>
    </html>
  );
}
