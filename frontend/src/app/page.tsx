"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/chat");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/chat");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main style={{ position: "relative", minHeight: "100vh", background: "var(--cyber-black)", overflowX: "hidden" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes grid-pan {
              from { background-position: 0 0; }
              to { background-position: 0 80px; }
            }
            @keyframes scanning-laser {
              0% { top: -10%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 110%; opacity: 0; }
            }
          `,
        }}
      />

      {/* BACKGROUND 3D GRID & SCANNER */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", opacity: 0.95 }} />
        <div style={{ position: "absolute", left: 0, right: 0, height: "4px", background: "var(--cyber-blue)", boxShadow: "0 0 20px 5px var(--cyber-blue-glow)", animation: "scanning-laser 6s linear infinite", zIndex: 5 }} />
        <div style={{ position: "absolute", inset: "-50%", backgroundImage: "linear-gradient(rgba(52, 229, 235, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 229, 235, 0.1) 1px, transparent 1px)", backgroundSize: "80px 80px", animation: "grid-pan 4s linear infinite", transform: "perspective(1000px) rotateX(65deg) scale(1.2)", transformOrigin: "center top", zIndex: 1 }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, padding: "4rem 2rem", maxWidth: "500px", margin: "0 auto", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div className="edgerunner-card" style={{ width: "100%", textAlign: "center", background: "rgba(15, 23, 42, 0.65)" }}>
          <h1 className="glitch-yellow" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            {isLogin ? "GAME COMPANION" : "REGISTER COMPANION"}
          </h1>
          <p style={{ color: "var(--cyber-blue)", fontFamily: "var(--font-mono)", marginBottom: "2rem", fontSize: "0.9rem" }}>
            [ AI CHATBOT TERMINAL ]
          </p>
          
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "1.5rem", fontSize: "1.2rem", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--cyber-border)", borderRadius: "8px", color: "var(--text-main)", outline: "none", fontFamily: "var(--font-mono)" }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "1.5rem", fontSize: "1.2rem", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--cyber-border)", borderRadius: "8px", color: "var(--text-main)", outline: "none", fontFamily: "var(--font-mono)" }}
              required
            />
            {error && <div style={{ color: "var(--cyber-red)", fontSize: "0.9rem", fontFamily: "var(--font-mono)" }}>[ERROR]: {error}</div>}
            
            <button type="submit" className="cyber-button" style={{ marginTop: "1rem", width: "100%" }}>
              {isLogin ? "INITIALIZE" : "CREATE ACCOUNT"}
            </button>

            {/* GOOGLE SIGN IN BUTTON */}
            <div style={{ position: "relative", textAlign: "center", margin: "1rem 0" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "var(--cyber-border)", zIndex: 1 }}></div>
              <span style={{ position: "relative", background: "rgba(15, 23, 42, 0.65)", padding: "0 10px", color: "var(--text-muted)", fontSize: "0.85rem", zIndex: 2, fontFamily: "var(--font-mono)" }}>OR</span>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding: "0.85rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--cyber-border)",
                borderRadius: "8px",
                color: "var(--text-main)",
                cursor: "pointer",
                fontFamily: "var(--font-header)",
                fontWeight: 600,
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "var(--cyber-blue)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "var(--cyber-border)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          <p style={{ marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {isLogin ? "Don't have an access key?" : "Already have an access key?"}
            <button onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", color: "var(--cyber-blue)", marginLeft: "0.5rem", cursor: "pointer", fontFamily: "var(--font-mono)", textDecoration: "underline" }}>
              {isLogin ? "REGISTER" : "LOGIN"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
