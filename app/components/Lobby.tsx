"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";

interface LobbyProps {
    myCode: string;
    onConnect: (remoteCode: string) => void;
    isConnecting: boolean;
    error: string | null;
}

export default function Lobby({ myCode, onConnect, isConnecting, error }: LobbyProps) {
    const [remoteCode, setRemoteCode] = useState("");
    const [activeTab, setActiveTab] = useState<"code" | "qr">("code");
    const [qrUrl, setQrUrl] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setQrUrl(`${window.location.origin}?code=${myCode}`);
        }
    }, [myCode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = remoteCode.trim().toUpperCase();
        if (code.length === 3) {
            onConnect(code);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
        setRemoteCode(val);
        if (val.length === 3) {
            onConnect(val);
        }
    };

    return (
        <main className="lobby-container">
            {/* Decorative orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="lobby-content">
                {/* Logo / Header */}
                <header className="lobby-header fade-in">
                    <div className="logo-icon pulse">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h1 className="lobby-title bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">PeerChat</h1>
                    <p className="lobby-subtitle">Instant peer-to-peer messaging — no servers, no sign-up</p>
                </header>

                {/* My Code Card */}
                <div className="glass-card code-card slide-up-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    <div className="tab-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                        <button
                            onClick={() => setActiveTab("code")}
                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: activeTab === "code" ? 'rgba(59, 130, 246, 0.4)' : 'transparent', color: activeTab === "code" ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
                        >
                            Text Code
                        </button>
                        <button
                            onClick={() => setActiveTab("qr")}
                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: activeTab === "qr" ? 'rgba(59, 130, 246, 0.4)' : 'transparent', color: activeTab === "qr" ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
                        >
                            QR Code
                        </button>
                    </div>

                    {activeTab === "code" ? (
                        <>
                            <div className="code-display-row mt-2">
                                <div className="code-display">
                                    {myCode.split("").map((char, i) => (
                                        <span key={i} className="code-char" style={{ animationDelay: `${i * 0.15}s` }}>
                                            {char}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="code-hint">Share this code with your friend</p>
                        </>
                    ) : (
                        <div style={{ padding: '16px', background: '#fff', borderRadius: '16px', display: 'inline-block', margin: '8px 0', animation: 'fadeIn 0.3s ease-out forwards' }}>
                            {qrUrl && <QRCode value={qrUrl} size={160} level="H" style={{ display: 'block' }} />}
                            <p style={{ textAlign: 'center', color: '#000', fontSize: '12px', fontWeight: 600, marginTop: '12px' }}>Scan to connect instantly</p>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="divider slide-up-2">
                    <span className="divider-line" />
                    <span className="divider-text">or connect to a peer</span>
                    <span className="divider-line" />
                </div>

                {/* Connect Form */}
                <section className="glass-card connect-card slide-up-3">
                    <h2 className="card-label">Enter Peer&apos;s Code</h2>
                    <div className="connect-input-row" style={{ position: "relative" }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={remoteCode}
                            onChange={handleInputChange}
                            placeholder="123"
                            className="connect-input"
                            maxLength={3}
                            disabled={isConnecting}
                            autoComplete="off"
                            spellCheck={false}
                            aria-label="Enter Peer's Code"
                        />
                        {isConnecting && (
                            <div style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)" }}>
                                <span className="spinner" />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="error-message shake" role="alert">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}
                </section>

                <footer className="footer-note slide-up-4">
                    End-to-end encrypted via WebRTC · No data stored
                </footer>
            </div>
        </main>
    );
}
