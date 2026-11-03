"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { api } from "@/lib/api";

const DOMAIN = process.env.NEXT_PUBLIC_STAFF_EMAIL_DOMAIN || "staff.dantam.local";

export default function LoginForm({ base }: { base: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const u = username.trim().toLowerCase();
    if (!u || !password) return setError("Enter your username and password.");
    setBusy(true);
    const auth = clientAuth();
    try {
      const email = u.includes("@") ? u : `${u}@${DOMAIN}`;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await api("/api/admin/session", { method: "POST", json: { idToken } });
      // The server now holds the session in a protected cookie. Drop the browser copy.
      await signOut(auth);
      window.location.href = base || "/";
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code.startsWith("auth/")) {
        setError(
          code === "auth/too-many-requests"
            ? "Too many attempts. Wait a few minutes and try again."
            : "Wrong username or password.",
        );
      } else {
        setError((err as Error).message);
      }
      setBusy(false);
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 480, paddingTop: 56, paddingBottom: 64 }}>
      <div className="logo" style={{ marginBottom: 20 }}>Dantam Front Desk</div>
      <form className="panel" onSubmit={submit} noValidate>
        <h1 style={{ fontSize: "1.7rem" }}>Staff sign in</h1>
        <p className="muted" style={{ margin: "6px 0 16px" }}>Authorised clinic staff only.</p>
        <div className="field">
          <label htmlFor="lg-user">Username</label>
          <input id="lg-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="lg-pass">Password</label>
          <input id="lg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="err" role="alert">{error}</div>
        <button className="btn primary" type="submit" disabled={busy} style={{ marginTop: 6 }}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
