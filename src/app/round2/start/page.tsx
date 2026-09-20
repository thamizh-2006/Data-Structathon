"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Code2, Trophy, Clock, ShieldCheck,
  Zap, AlertTriangle, Lock, CheckCircle2, XCircle, Minus,
  Maximize2
} from "lucide-react";

interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  order_index: number;
  submission_count: number;
  best_score: number;
  best_status: string | null;
}

export default function Round2StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
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
          setProblems(probRes.problems || []);
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

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case "Easy": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
      case "Medium": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "Hard": return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
      default: return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
    }
  }

  function getStatusIcon(status: string | null) {
    if (!status) return <Minus size={14} className="text-slate-400" />;
    if (status === "ACCEPTED") return <CheckCircle2 size={14} className="text-emerald-500" />;
    return <XCircle size={14} className="text-rose-500" />;
  }

  async function handleEnterEditor(problemId: string) {
    if (!agreed) return;
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Fullscreen not critical here
    }
    router.push(`/round2/editor?problem=${problemId}`);
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
            Loading Round 2 problems…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-4 participant-protected">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold" style={{ color: "var(--color-success)" }}>
            ProctorGuard v2.4 Active
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
        <p className="text-xs sm:text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          Solve algorithmic problems using the built-in code editor. Your code is graded against
          hidden test cases. Each problem can be submitted multiple times — only your best score counts.
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 rounded-xl border space-y-1.5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <Clock size={20} style={{ color: "var(--color-accent)" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>90 Minute Window</h3>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Solve all problems within the time limit. Manage your time across challenges.
          </p>
        </div>
        <div className="card p-4 rounded-xl border space-y-1.5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <Trophy size={20} style={{ color: "var(--color-success)" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>Best Score Wins</h3>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Submit unlimited times. Only your highest scoring submission per problem counts.
          </p>
        </div>
        <div className="card p-4 rounded-xl border space-y-1.5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <Zap size={20} style={{ color: "var(--color-warning)" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>4 Languages</h3>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Python 3, JavaScript, C++ 17, or Java 17. Pick your weapon per problem.
          </p>
        </div>
      </div>

      {/* Problems List */}
      {!error && (
        <div className="space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Code2 size={18} style={{ color: "var(--color-accent)" }} /> Problem Set ({problems.length})
          </h2>

          <div className="space-y-3">
            {problems.map((problem) => {
              const dc = getDifficultyColor(problem.difficulty);
              return (
                <div
                  key={problem.id}
                  className="card p-5 rounded-xl border transition-all hover:shadow-md"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        #{problem.order_index}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                          {problem.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border ${dc.bg} ${dc.text} ${dc.border}`}>
                            {problem.difficulty.toUpperCase()}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                            {problem.points} pts
                          </span>
                          <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-tertiary)" }}>
                            {getStatusIcon(problem.best_status)}
                            {problem.submission_count > 0
                              ? `${problem.best_score}/${problem.points} (${problem.submission_count} submissions)`
                              : "Not attempted"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEnterEditor(problem.id)}
                      disabled={!agreed}
                      className="btn btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Solve <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agreement & Launch */}
      {!error && (
        <div
          className="card p-6 rounded-2xl border space-y-4 shadow-sm"
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
              className="text-xs font-semibold cursor-pointer select-none leading-relaxed"
              style={{ color: "var(--color-text-primary)" }}
            >
              I understand that proctoring is active throughout Round 2. Tab switching, fullscreen exits,
              and unauthorized clipboard usage will be recorded. Only my best submission score per problem will count.
            </label>
          </div>

          <div
            className="flex items-center justify-between gap-4 pt-3 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              {problems.length} problems • Max possible:{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {problems.reduce((sum, p) => sum + p.points, 0)} pts
              </strong>
            </div>
            {agreed ? (
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 size={14} /> Select a problem above to begin
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                <Lock size={14} /> Accept terms to unlock problems
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
