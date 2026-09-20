"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import FloatingDSIcons from "@/components/FloatingDSIcons";


type LoginState = "idle" | "loading" | "confirm" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
    // If already logged in, redirect
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace(data.role === "admin" ? "/admin" : "/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  async function doLogin(force = false) {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, force }),
      });
      const data = await res.json();

      if (res.status === 409 && data.requiresConfirmation) {
        setState("confirm");
        return;
      }

      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error || "Invalid username or password");
        return;
      }

      setState("success");
      if (data.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setState("error");
      setErrorMsg("Unable to connect. Please check your connection and try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    doLogin(false);
  }

  async function handleForceLogin() {
    setConfirming(true);
    await doLogin(true);
    setConfirming(false);
  }

  const isLoading = state === "loading";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-palette-cream) 0%, var(--color-surface-2) 50%, var(--color-palette-cream) 100%)" }}>

      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full" style={{ background: "#4f46e5", opacity: 0.4 }} />
        <div className="absolute top-1/4 right-1/3 w-3 h-3 rounded-full" style={{ background: "#818cf8", opacity: 0.3 }} />
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full" style={{ background: "#4f46e5", opacity: 0.5 }} />
      </div>

      {/* Floating DS decorations */}
      <FloatingDSIcons opacity={0.45} density="normal" />

      <div className="w-full max-w-md relative">

        {/* Logo / Branding */}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, var(--color-palette-burgundy), var(--color-palette-crimson))", boxShadow: "0 8px 24px rgba(139, 0, 0, 0.35)" }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="11" height="11" rx="2" fill="white" opacity="0.9" />
              <rect x="17" y="2" width="11" height="11" rx="2" fill="white" opacity="0.6" />
              <rect x="2" y="17" width="11" height="11" rx="2" fill="white" opacity="0.6" />
              <rect x="17" y="17" width="11" height="11" rx="2" fill="white" opacity="0.3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Data Structathon
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            2026 — Competitive Exam Platform
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-xl)" }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Sign in to your account
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Enter your username and password to continue.
            </p>
          </div>

          {/* Error Banner */}
          {state === "error" && (
            <div className="flex items-start gap-3 p-4 rounded-lg mb-5" role="alert"
              style={{ background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)" }}>
              <AlertCircle size={16} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>{errorMsg}</p>
            </div>
          )}

          {/* Session Conflict Confirm Dialog */}
          {state === "confirm" && (
            <div className="p-4 rounded-lg mb-5"
              style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-warning)" }}>
                Active session detected
              </p>
              <p className="text-sm mb-4" style={{ color: "#78350f" }}>
                Another session is currently active for this team. Signing in here will immediately log out the other session.
              </p>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" disabled={confirming} onClick={handleForceLogin}>
                  {confirming ? (
                    <><Loader2 size={14} className="animate-spin" /> Signing in…</>
                  ) : (
                    <>Sign in here <ChevronRight size={14} /></>
                  )}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setState("idle")}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}>
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--color-text-tertiary)" }} />
                  <input
                    ref={usernameRef}
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="input"
                    style={{ paddingLeft: "2.5rem" }}
                    placeholder="Enter your username or team ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading || state === "success"}
                    aria-describedby={state === "error" ? "login-error" : undefined}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--color-text-tertiary)" }} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="input"
                    style={{ paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || state === "success"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                className="btn btn-primary btn-lg w-full mt-2"
                disabled={isLoading || state === "success" || !username.trim() || !password}
              >
                {isLoading || state === "success" ? (
                  <><Loader2 size={18} className="animate-spin" /> {state === "success" ? "Redirecting…" : "Signing in…"}</>
                ) : (
                  <>Sign in <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          </form>

          <hr className="divider" />
          <p className="text-xs text-center" style={{ color: "var(--color-text-tertiary)" }}>
            Contest credentials have been provisioned by the event coordinators.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          &copy; 2026 Data Structathon &mdash; All sessions are monitored and recorded.
        </p>
      </div>
    </div>
  );
}
