"use client";

import { useState, useEffect, ComponentType } from "react";

export default function Home() {
  const [ChatApp, setChatApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    import("./components/ChatApp")
      .then((mod) => {
        setChatApp(() => mod.default);
      })
      .catch((err) => {
        console.error("Failed to load ChatApp:", err);
      });
  }, []);

  if (ChatApp) {
    return <ChatApp />;
  }

  return (
    <div className="init-screen">
      <div className="spinner-lg" />
      <p className="init-text">Loading...</p>
    </div>
  );
}
