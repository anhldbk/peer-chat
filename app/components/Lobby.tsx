"use client";

import { useState, useRef } from "react";

interface LobbyProps {
    myCode: string;
    onConnect: (remoteCode: string) => void;
    isConnecting: boolean;
    error: string | null;
}

export default function Lobby({ myCode, onConnect, isConnecting, error }: LobbyProps) {
    const [remoteCode, setRemoteCode] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

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
    };

    return (
        <div className="lobby-container">
            {/* Decorative orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="lobby-content">
                {/* Logo / Header */}
                <div className="lobby-header fade-in">
                    <div className="logo-icon pulse">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h1 className="lobby-title bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">PeerChat</h1>
                    <p className="lobby-subtitle">Instant peer-to-peer messaging — no servers, no sign-up</p>
                </div>

                {/* My Code Card */}
                <div className="glass-card code-card slide-up-1">
                    <div className="card-label">Your Code</div>
                    <div className="code-display-row">
                        <div className="code-display">
                            {myCode.split("").map((char, i) => (
                                <span key={i} className="code-char" style={{ animationDelay: `${i * 0.15}s` }}>
                                    {char}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="code-hint">Share this code with your friend</p>
                </div>

                {/* Divider */}
                <div className="divider slide-up-2">
                    <span className="divider-line" />
                    <span className="divider-text">or connect to a peer</span>
                    <span className="divider-line" />
                </div>

                {/* Connect Form */}
                <form onSubmit={handleSubmit} className="glass-card connect-card slide-up-3">
                    <div className="card-label">Enter Peer&apos;s Code</div>
                    <div className="connect-input-row">
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
                        />
                        <button
                            type="submit"
                            className={`connect-btn ${isConnecting ? 'connecting' : ''}`}
                            disabled={remoteCode.length !== 3 || isConnecting}
                        >
                            {isConnecting ? (
                                <span className="spinner" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="error-message shake">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}
                </form>

                <p className="footer-note slide-up-4">
                    End-to-end encrypted via WebRTC · No data stored
                </p>
            </div>
        </div>
    );
}
