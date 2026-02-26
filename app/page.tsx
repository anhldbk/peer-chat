"use client";

import { useState, useEffect, useCallback, ComponentType } from "react";

// Debug panel that shows errors visually on e-ink
function DebugOverlay({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "#fff", color: "#000", padding: 20,
      fontFamily: "monospace", fontSize: 13, lineHeight: 1.6,
      overflow: "auto", zIndex: 9999,
      whiteSpace: "pre-wrap", wordBreak: "break-all",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, borderBottom: "2px solid #000", paddingBottom: 8 }}>
        PeerChat Debug
      </h2>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: 6, borderBottom: "1px solid #ccc", paddingBottom: 6 }}>
          {log}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [ChatApp, setChatApp] = useState<ComponentType | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  const addLog = useCallback((msg: string) => {
    setDebugLogs((prev) => [...prev, "[" + new Date().toLocaleTimeString() + "] " + msg]);
  }, []);

  useEffect(() => {
    addLog("Page loaded. UA: " + navigator.userAgent);
    addLog("Window size: " + window.innerWidth + "x" + window.innerHeight);

    // Check WebRTC support
    const w = window as unknown as Record<string, unknown>;
    const hasRTC = !!(w.RTCPeerConnection || w.webkitRTCPeerConnection || w.mozRTCPeerConnection);
    addLog("WebRTC supported: " + hasRTC);

    // Check if PeerJS can be loaded
    addLog("Loading PeerJS module...");

    import("peerjs")
      .then((mod) => {
        addLog("PeerJS loaded OK. Peer constructor: " + typeof mod.default);

        // Now try loading ChatApp
        addLog("Loading ChatApp module...");
        return import("./components/ChatApp");
      })
      .then((mod) => {
        addLog("ChatApp loaded OK!");
        setChatApp(() => mod.default);
      })
      .catch((err) => {
        addLog("LOAD ERROR: " + String(err));
        addLog("Error name: " + (err instanceof Error ? err.name : "unknown"));
        addLog("Error message: " + (err instanceof Error ? err.message : String(err)));
        if (err instanceof Error && err.stack) {
          addLog("Stack: " + err.stack.substring(0, 500));
        }
        setLoadFailed(true);
      });

    // Global error handler
    const onError = (e: ErrorEvent) => {
      addLog("GLOBAL ERROR: " + e.message + " at " + e.filename + ":" + e.lineno);
    };
    const onUnhandled = (e: PromiseRejectionEvent) => {
      addLog("UNHANDLED REJECTION: " + String(e.reason));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [addLog]);

  // Show debug overlay if there are errors
  if (loadFailed) {
    return <DebugOverlay logs={debugLogs} />;
  }

  // Show loaded app
  if (ChatApp) {
    return <ChatApp />;
  }

  // Loading state
  return (
    <div className="init-screen">
      <div className="spinner-lg" />
      <p className="init-text">Loading...</p>
      <p style={{ marginTop: 16, fontSize: 11, color: "#999", maxWidth: 300, textAlign: "center" }}>
        {debugLogs.length > 0 ? debugLogs[debugLogs.length - 1] : ""}
      </p>
    </div>
  );
}
