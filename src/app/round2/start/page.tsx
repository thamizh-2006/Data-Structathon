"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Code2, Trophy, Clock, ShieldCheck,
  Zap, AlertTriangle, Lock, CheckCircle2, Shield
} from "lucide-react";

export default function Round2StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch("/api/auth/me").then((r) => r.json());
        if (!meRes.authenticated || meRes.role !== "team") {
          router.replace("/login");
          return;
        }

        if (meRes.is_disqualified) {
          setError("Your team has been disqualified from Data Structathon.");
          setLoading(false);
          return;
        }

        const probRes = await fetch("/api/round2/problems").then((r) => r.json());
        if (probRes.error) {
          setError(probRes.error);
        } else {
          setTeamName(probRes.team_name || "");
        }
      } catch {
        setError("Could not load Round 2 data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  async function handleEnterEditor() {
    if (!agreed) return;
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Fullscreen not critical here
    }
    router.push(`/round2/editor`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin mx-auto"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-tertiary)" }}>
            Loading Round 2 details…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-4 participant-protected">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold flex items-center gap-1.5 transition-colors hover:text-indigo-600"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold" style={{ color: "var(--color-success)" }}>
            ProctorGuard v2.4 Ready
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-3"
        style={{
          background: `linear-gradient(135deg, var(--color-palette-espresso) 0%, var(--color-palette-burgundy) 60%, var(--color-palette-crimson) 100%)`,
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15">
          <Code2 size={14} className="text-amber-300" /> Algorithmic Coding Challenge
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Round 2: Code Arena
        </h1>
        <p className="text-xs sm:text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          Welcome to the final round! You will face a set of algorithmic problems requiring you to write code in your browser. 
          Your code will be evaluated against hidden test cases.
        </p>

        {teamName && (
          <div className="flex items-center gap-2 pt-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white/80">Team: {teamName}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 text-sm flex items-start gap-3 rounded-xl border"
          style={{
            background: "var(--color-error-bg)",
            borderColor: "var(--color-error-border)",
            color: "var(--color-error)",
          }}
        >
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!error && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Shield size={20} style={{ color: "var(--color-accent)" }} /> Instructions
          </h2>
          <ul className="space-y-3 pl-1">
            <li className="flex items-start gap-3 text-sm">
              <Clock className="shrink-0 mt-0.5 text-indigo-500" size={18} />
              <span style={{ color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-text-primary)" }}>Global Timer:</strong> The timer starts immediately for all teams when the admin unlocks the round. The overall duration is fixed.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Trophy className="shrink-0 mt-0.5 text-emerald-500" size={18} />
              <span style={{ color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-text-primary)" }}>Best Score Wins:</strong> You can submit your code multiple times. Only your highest scoring submission per problem counts.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Zap className="shrink-0 mt-0.5 text-amber-500" size={18} />
              <span style={{ color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-text-primary)" }}>Languages:</strong> You can write code in Python 3, JavaScript, C++ 17, or Java 17.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <AlertTriangle className="shrink-0 mt-0.5 text-rose-500" size={18} />
              <span style={{ color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-text-primary)" }}>Proctoring:</strong> Tab switching, fullscreen exits, and unauthorized clipboard usage will be recorded and may result in disqualification.
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Agreement & Launch */}
      {!error && (
        <div
          className="card p-6 rounded-2xl border space-y-5 shadow-sm mt-8"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="r2-agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer mt-0.5"
              style={{ accentColor: "var(--color-accent)" }}
            />
            <label
              htmlFor="r2-agreement"
              className="text-sm font-semibold cursor-pointer select-none leading-relaxed"
              style={{ color: "var(--color-text-primary)" }}
            >
              I understand the instructions and agree to the proctoring guidelines.
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <button
              onClick={handleEnterEditor}
              disabled={!agreed}
              className="btn btn-primary px-8 py-3 text-sm font-bold flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Round 2 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
