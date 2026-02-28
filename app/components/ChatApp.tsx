"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { DataConnection } from "peerjs";
import { generateShortCode, createPeer, connectToPeer, generateMessageId, ChatMessage, NETWORK_NAMESPACE } from "../lib/peer";
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

        const initializePeer = async (peerCodeToTry: string) => {
            try {
                const peer = await createPeer(peerCodeToTry);
                if (!mounted) {
                    peer.destroy();
                    return;
                }
                peerRef.current = peer;

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

                // Check for URL parameters to auto-connect
                const params = new URLSearchParams(window.location.search);
                const connectCode = params.get("code");
                if (connectCode && connectCode.length === 3) {
                    // Auto connect payload
                    handleConnect(connectCode.toUpperCase());
                } else {
                    setAppState("lobby");
                }

            } catch (err) {
                if (!mounted) return;
                console.warn(`Failed to connect with code ${peerCodeToTry}:`, err);

                // If code is taken or failed, try again with a new code
                const retryCode = generateShortCode();
                setMyCode(retryCode);

                try {
                    const peer = await createPeer(retryCode);
                    if (!mounted) {
                        peer.destroy();
                        return;
                    }
                    peerRef.current = peer;

                    peer.on("connection", (conn) => {
                        handleConnection(conn);
                    });

                    // Check for URL parameters to auto-connect
                    const params = new URLSearchParams(window.location.search);
                    const connectCode = params.get("code");
                    if (connectCode && connectCode.length === 3) {
                        handleConnect(connectCode.toUpperCase());
                    } else {
                        setAppState("lobby");
                    }

                } catch (retryErr) {
                    if (!mounted) return;
                    setError(`Could not connect to signaling server: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`);
                    setAppState("lobby");
                }
            }
        };

        initializePeer(code);

        return () => {
            mounted = false;
            // Removed closing references inside cleanup to prevent disconnecting during React strict mode double-renders
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConnection = useCallback((conn: DataConnection, alreadyOpen = false) => {
        connRef.current = conn;
        const displayCode = conn.peer.replace(NETWORK_NAMESPACE, '');
        setPeerCode(displayCode);
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
            const payload = data as ChatMessage;
            setMessages((prev) => [
                ...prev,
                {
                    id: payload.id,
                    text: payload.text,
                    sender: "peer",
                    timestamp: payload.timestamp,
                    file: payload.file,
                },
            ]);
        });

        conn.on("close", () => {
            console.log("Connection closed manually or dropped.");
            setAppState("lobby");
            connRef.current = null;
            setPeerCode("");
            setMessages([]);
        });

        conn.on("error", (err) => {
            console.error("Connection error:", err);
            setAppState("lobby");
            connRef.current = null;
            setError(`Connection error: ${err?.message || err || "Unknown error"}`);
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
                console.error("Failed to connect:", err);
                setError(err instanceof Error ? err.message : "Failed to connect.");
                setAppState("lobby");
            }
        },
        [handleConnection]
    );

    const handleSend = useCallback((text: string, file?: File) => {
        if (!connRef.current) return;

        if (file) {
            // Process file sending
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (!arrayBuffer) return;

                const msg: ChatMessage = {
                    id: generateMessageId(),
                    text,
                    sender: "me",
                    timestamp: Date.now(),
                    file: {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: arrayBuffer,
                    },
                };

                // Send to peer
                connRef.current!.send(msg);

                // Add to local state
                setMessages((prev) => [...prev, msg]);
            };
            reader.readAsArrayBuffer(file);
        } else {
            // Process text sending
            const msg: ChatMessage = {
                id: generateMessageId(),
                text,
                sender: "me",
                timestamp: Date.now(),
            };

            connRef.current.send(msg);
            setMessages((prev) => [...prev, msg]);
        }
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
