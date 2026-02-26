"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { DataConnection } from "peerjs";
import { generateShortCode, createPeer, connectToPeer, generateMessageId, ChatMessage } from "../lib/peer";
import Lobby from "./Lobby";
import ChatView from "./ChatView";

type AppState = "initializing" | "lobby" | "connecting" | "chat";

export default function ChatApp() {
    const [appState, setAppState] = useState<AppState>("initializing");
    const [myCode, setMyCode] = useState("");
    const [peerCode, setPeerCode] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);

    // Initialize peer on mount
    useEffect(() => {
        const code = generateShortCode();
        setMyCode(code);

        let mounted = true;

        createPeer(code)
            .then((peer) => {
                if (!mounted) {
                    peer.destroy();
                    return;
                }
                peerRef.current = peer;
                setAppState("lobby");

                // Listen for incoming connections
                peer.on("connection", (conn) => {
                    handleConnection(conn);
                });

                peer.on("disconnected", () => {
                    // Try to reconnect to the signaling server
                    if (peerRef.current && !peerRef.current.destroyed) {
                        peerRef.current.reconnect();
                    }
                });
            })
            .catch(() => {
                if (!mounted) return;
                // If code is taken, try again with a new code
                const retryCode = generateShortCode();
                setMyCode(retryCode);
                createPeer(retryCode)
                    .then((peer) => {
                        if (!mounted) {
                            peer.destroy();
                            return;
                        }
                        peerRef.current = peer;
                        setAppState("lobby");
                        peer.on("connection", (conn) => {
                            handleConnection(conn);
                        });
                    })
                    .catch((err) => {
                        if (!mounted) return;
                        setError(`Could not connect to signaling server: ${err.message}`);
                        setAppState("lobby");
                    });
            });

        return () => {
            mounted = false;
            if (connRef.current) {
                connRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConnection = useCallback((conn: DataConnection, alreadyOpen = false) => {
        connRef.current = conn;
        setPeerCode(conn.peer);
        setMessages([]);
        setError(null);

        if (alreadyOpen) {
            // Initiator: connectToPeer already waited for 'open'
            setAppState("chat");
        } else {
            // Receiver: wait for 'open' event
            conn.on("open", () => {
                setAppState("chat");
            });
        }

        conn.on("data", (data) => {
            const payload = data as { text: string; id: string; timestamp: number };
            setMessages((prev) => [
                ...prev,
                {
                    id: payload.id,
                    text: payload.text,
                    sender: "peer",
                    timestamp: payload.timestamp,
                },
            ]);
        });

        conn.on("close", () => {
            setAppState("lobby");
            connRef.current = null;
            setPeerCode("");
            setMessages([]);
        });

        conn.on("error", () => {
            setAppState("lobby");
            connRef.current = null;
            setError("Connection lost.");
        });
    }, []);

    const handleConnect = useCallback(
        async (remoteCode: string) => {
            if (!peerRef.current) return;
            setAppState("connecting");
            setError(null);

            try {
                const conn = await connectToPeer(peerRef.current, remoteCode);
                handleConnection(conn, true); // already open
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to connect.");
                setAppState("lobby");
            }
        },
        [handleConnection]
    );

    const handleSend = useCallback((text: string) => {
        if (!connRef.current) return;

        const msg: ChatMessage = {
            id: generateMessageId(),
            text,
            sender: "me",
            timestamp: Date.now(),
        };

        connRef.current.send({ id: msg.id, text: msg.text, timestamp: msg.timestamp });
        setMessages((prev) => [...prev, msg]);
    }, []);

    const handleDisconnect = useCallback(() => {
        if (connRef.current) {
            connRef.current.close();
            connRef.current = null;
        }
        setAppState("lobby");
        setPeerCode("");
        setMessages([]);
    }, []);

    if (appState === "initializing") {
        return (
            <div className="init-screen">
                <div className="spinner-lg" />
                <p className="init-text">Connecting to network...</p>
            </div>
        );
    }

    if (appState === "chat") {
        return (
            <ChatView
                messages={messages}
                onSend={handleSend}
                onDisconnect={handleDisconnect}
                peerCode={peerCode}
            />
        );
    }

    return (
        <Lobby
            myCode={myCode}
            onConnect={handleConnect}
            isConnecting={appState === "connecting"}
            error={error}
        />
    );
}
