"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const newGameRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Tạo một ref để đánh dấu điểm cuối cùng của khung chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. Thêm useEffect này để tự cuộn xuống mỗi khi mảng messages cập nhật
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kiểm tra đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        const token = await currentUser.getIdToken();
        fetchMessages(currentUser.uid, token);
        fetchWishlist(token);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Lấy lịch sử chat từ FastAPI
  const fetchMessages = async (uid: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:8000/messages/${uid}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Lỗi lấy tin nhắn:", e);
    }
  };

  // Lấy Wishlist
  const fetchWishlist = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/wishlist", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
      }
    } catch (e) {
      console.error("Lỗi lấy wishlist:", e);
    }
  };

  const addWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const gameName = newGameRef.current?.value;
    if (!gameName?.trim() || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:8000/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ game_name: gameName })
      });
      if (res.ok) {
        if (newGameRef.current) newGameRef.current.value = "";
        fetchWishlist(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeWishlist = async (id: string) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:8000/wishlist/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWishlist(token);
      }
    } catch(e) {
      console.error(e);
    }
  };

  // Gửi tin nhắn mới
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputValue = inputRef.current?.value;
    if (!inputValue?.trim() || !user) return;

    const newMsg = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, newMsg]);
    if (inputRef.current) inputRef.current.value = "";
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.uid, message: newMsg.content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (e) {
      console.error("Lỗi gửi tin nhắn:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ color: "var(--cyber-yellow)", padding: "2rem", fontFamily: "var(--font-mono)" }}>[SYSTEM]: INITIALIZING UPLINK...</div>;

  return (
    <main style={{ height: "100vh", background: "var(--cyber-black)", padding: "2rem", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 className="glitch-yellow" style={{ fontSize: "2rem", margin: 0 }}>AETHERION TERMINAL</h1>
          <div className="data-display" style={{ marginTop: "0.5rem" }}>AGENT: {user.email}</div>
        </div>
        <button onClick={() => signOut(auth)} className="cyber-button" style={{ padding: "0.75rem 1.5rem", fontSize: "0.85rem" }}>
          DISCONNECT
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem", flex: 1, minHeight: 0, padding: "10px 5px" }}>
        
        {/* CHAT CONTAINER (70%) */}
        <div className="edgerunner-card" style={{ flex: 7, display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(15, 23, 42, 0.65)" }}>
          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--cyber-blue)", marginBottom: "0.25rem", fontFamily: "var(--font-mono)", textAlign: msg.role === "user" ? "right" : "left" }}>
                  {msg.role === "user" ? "YOU" : "SYSTEM AI"}
                </div>
                <div style={{
                  background: msg.role === "user" ? "rgba(52, 229, 235, 0.15)" : "rgba(30, 41, 59, 0.9)",
                  border: `1px solid ${msg.role === "user" ? "var(--cyber-blue)" : "var(--cyber-border)"}`,
                  padding: "1rem",
                  borderRadius: "8px",
                  color: "var(--text-main)",
                  boxShadow: msg.role === "user" ? "0 0 15px var(--cyber-blue-glow)" : "none",
                  lineHeight: "1.6",
                }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", color: "var(--cyber-yellow)", fontFamily: "var(--font-mono)", marginTop: "1rem" }}>
                [PROCESSING REQUEST...]
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <form onSubmit={sendMessage} style={{ marginTop: "1rem", display: "flex", gap: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--cyber-border)" }}>
            <input
              type="text"
              ref={inputRef}
              placeholder="Enter query..."
              style={{ flex: 1, padding: "1.5rem", fontSize: "1.2rem", background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--cyber-border)", borderRadius: "8px", color: "var(--text-main)", outline: "none", fontFamily: "var(--font-mono)" }}
            />
            <button type="submit" className="cyber-button" disabled={loading} style={{ padding: "0 2.5rem", fontSize: "1.1rem" }}>
              TRANSMIT
            </button>
          </form>
        </div>

        {/* WISHLIST CONTAINER (30%) */}
        <div className="edgerunner-card" style={{ flex: 3, display: "flex", flexDirection: "column", background: "rgba(15, 23, 42, 0.65)" }}>
          <h2 className="glitch-yellow" style={{ fontSize: "1.2rem", marginBottom: "1rem", textAlign: "center" }}>WISHLIST DATABANK</h2>
          
          <form onSubmit={addWishlist} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <input
              type="text"
              ref={newGameRef}
              placeholder="Save a game..."
              style={{ flex: 1, padding: "0.75rem", fontSize: "0.9rem", background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--cyber-border)", borderRadius: "4px", color: "var(--text-main)", outline: "none", fontFamily: "var(--font-mono)" }}
            />
            <button type="submit" className="cyber-button" style={{ padding: "0 1rem", fontSize: "0.85rem", minWidth: "60px" }}>
              ADD
            </button>
          </form>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {wishlist.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", fontStyle: "italic" }}>No entries found.</div>
            ) : (
              wishlist.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(30, 41, 59, 0.9)", border: "1px solid var(--cyber-border)", padding: "0.75rem", borderRadius: "4px" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--cyber-blue)" }}>{item.game_name}</span>
                  <button 
                    onClick={() => removeWishlist(item.id)}
                    style={{ background: "none", border: "none", color: "var(--cyber-red)", cursor: "pointer", fontSize: "1.2rem", lineHeight: "1" }}
                    title="Delete Entry"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
