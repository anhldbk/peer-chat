"use client";

import dynamic from "next/dynamic";

const ChatApp = dynamic(() => import("./components/ChatApp"), {
  ssr: false,
  loading: () => (
    <div className="init-screen">
      <div className="spinner-lg" />
      <p className="init-text">Loading...</p>
    </div>
  ),
});

export default function Home() {
  return <ChatApp />;
}
