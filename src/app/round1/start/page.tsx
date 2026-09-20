"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert, Clock, Award, AlertTriangle, Maximize2,
  CheckCircle2, ArrowRight, ShieldCheck, Eye, Sparkles,
  Copy, MonitorX, KeyRound, Radio, Zap, ArrowLeft, RefreshCw, CameraOff
} from "lucide-react";

interface TestDetection {
  id: string;
  name: string;
  description: string;
  howToTest: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  triggered: boolean;
}

export default function Round1StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live walkthrough interactive simulator states
  const [activeTab, setActiveTab] = useState<"walkthrough" | "overview">("walkthrough");
  const [detectedEvents, setDetectedEvents] = useState<string[]>([]);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const [meRes, r1Res] = await Promise.all([
          fetch("/api/auth/me").then((r) => r.json()),
          fetch("/api/round1/question").then((r) => r.json()).catch(() => ({})),
        ]);

        if (!meRes.authenticated || meRes.role !== "team") {
          router.replace("/login");
          return;
        }

        if (meRes.is_disqualified) {
          setError("Your team has been disqualified from Data Structathon.");
          setLoading(false);
          return;
        }

        setTeamInfo(meRes);

        if (r1Res.status === "completed") {
          router.replace("/round1/summary");
          return;
        }

        if (r1Res.error) {
          setError(r1Res.error);
          setUnlocked(false);
        } else {
          setUnlocked(true);
          setTotalQuestions(r1Res.totalQuestions || r1Res.total || 0);
        }
      } catch {
        setError("Could not verify round status. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [router]);

  // Real-time sensor sandbox during the walkthrough
  useEffect(() => {
    function logEvent(name: string) {
      setDetectedEvents((prev) => [
        `[${new Date().toLocaleTimeString()}] ${name}`,
        ...prev.slice(0, 7),
      ]);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        logEvent("TAB_SWITCH / WINDOW_MINIMIZED (Severity: HIGH)");
      } else {
        logEvent("FOCUS_RESTORED (User returned to tab)");
      }
    }

    function onBlur() {
      logEvent("WINDOW_BLUR: Lost focus to another window or split screen (Severity: HIGH)");
    }

    function onCopy() {
      logEvent("CLIPBOARD_COPY: Copy attempted on test content (Severity: HIGH)");
    }

    function onPaste() {
      logEvent("CLIPBOARD_PASTE: Paste detected from outside source (Severity: MEDIUM)");
    }

    function onFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreenActive(active);
      if (!active) {
        logEvent("FULLSCREEN_EXIT: Assessment view collapsed (Severity: CRITICAL)");
      } else {
        logEvent("FULLSCREEN_ENTERED: Assessment locked to active display");
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        logEvent(`KEY_BLOCK: Blocked shortcut [${e.key}] - DevTools attempt (Severity: HIGH)`);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleToggleFullscreenDemo() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  }

  async function handleEnterFullscreenAndStart() {
    if (!agreed) return;
    setStarting(true);
    setError(null);

    try {
      // Enter Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }

      // Start round
      const res = await fetch("/api/round1/start", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start round.");
        setStarting(false);
        return;
      }

      router.push("/round1/quiz");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Checking round eligibility & proctor engine…</p>
        </div>
      </div>
    );
  }

  const PROCTOR_RULES = [
    {
      title: "Fullscreen Required",
      badge: "CRITICAL",
      badgeBg: "text-rose-600 border-rose-200 bg-rose-50",
      desc: "Any escape gesture is instantly flagged.",
    },
    {
      title: "No Tab Switching",
      badge: "HIGH",
      badgeBg: "text-amber-600 border-amber-200 bg-amber-50",
      desc: "Leaving the tab is strictly logged.",
    },
    {
      title: "Clipboard Disabled",
      badge: "HIGH",
      badgeBg: "text-amber-600 border-amber-200 bg-amber-50",
      desc: "Copying/pasting text is forbidden.",
    },
    {
      title: "DevTools Blocked",
      badge: "HIGH",
      badgeBg: "text-[#5b0202] border-[#f3c2c2] bg-[#fbeeed]",
      desc: "Shortcuts like F12 & Inspect are suppressed.",
    },
    {
      title: "No Screenshots",
      badge: "CRITICAL",
      badgeBg: "text-rose-600 border-rose-200 bg-rose-50",
      desc: "Screenshot keys are blocked & logged.",
    },
    {
      title: "Single Device",
      badge: "DISQUALIFICATION",
      badgeBg: "text-red-800 border-red-200 bg-red-100",
      desc: "Logging in elsewhere aborts session.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-4">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ background: "var(--color-success)" }} />
          <span className="text-xs font-mono font-bold" style={{ color: "var(--color-success)" }}>ProctorGuard v2.4 Active</span>
        </div>
      </div>

      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-3"
        style={{
          background: "linear-gradient(135deg, var(--color-palette-espresso) 0%, var(--color-palette-burgundy) 60%, var(--color-palette-crimson) 100%)",
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15" style={{ color: "var(--color-palette-cream)" }}>
          <ShieldCheck size={14} style={{ color: "var(--color-palette-cream)" }} /> Interactive Pre-Flight Inspection
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Round 1: Proctored Activity Walkthrough
        </h1>
        <p className="text-xs sm:text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(237,231,199,0.8)" }}>
          Before starting the timed assessment, review and test each security mechanism below. 
          The live sensor sandbox demonstrates exactly what the admin proctoring console observes in real time.
        </p>
      </div>

      {/* Status Warning if locked or error */}
      {error && (
        <div className="card p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 rounded-xl">
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={() => setActiveTab("walkthrough")}
          className={`px-4 py-2.5 text-sm font-bold flex items-center gap-2 border-b-2 -mb-px transition-all`}
          style={{
            borderColor: activeTab === "walkthrough" ? "var(--color-palette-crimson)" : "transparent",
            color: activeTab === "walkthrough" ? "var(--color-palette-crimson)" : "var(--color-text-tertiary)",
          }}
        >
          <Sparkles size={16} /> Live Security Walkthrough & Sandbox
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-sm font-bold flex items-center gap-2 border-b-2 -mb-px transition-all`}
          style={{
            borderColor: activeTab === "overview" ? "var(--color-palette-crimson)" : "transparent",
            color: activeTab === "overview" ? "var(--color-palette-crimson)" : "var(--color-text-tertiary)",
          }}
        >
          <Clock size={16} /> Scoring & Format Rules
        </button>
      </div>

      {activeTab === "walkthrough" && (
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
          {/* Detailed Proctored Activities List */}
          <div className="space-y-4 lg:w-1/2 order-2 lg:order-1">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <Eye style={{ color: "var(--color-accent)" }} size={18} /> Monitored Proctored Parameters
            </h2>

            <ul className="space-y-3">
              {PROCTOR_RULES.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex flex-col gap-1 pb-3 border-b last:border-0"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
                      {idx + 1}. {rule.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border ${rule.badgeBg}`}>
                      {rule.badge}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {rule.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Sensor Sandbox Console */}
          <div className="sticky top-6 lg:w-1/2 order-1 lg:order-2 w-full">
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-success)" }} />
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-text-primary)" }}>
                    Live Sensor Sandbox
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFullscreenDemo}
                    className="px-2 py-1 text-xs font-bold transition-all text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    {isFullscreenActive ? "Exit Fullscreen" : "Test Fullscreen Toggle"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetectedEvents([])}
                    className="px-2 py-1 text-xs font-medium transition-all text-slate-500 hover:text-slate-800 underline"
                  >
                    Clear Log
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Try alt-tabbing, switching tabs, copying text, or pressing F12 or PrintScreen. The events below are captured by the client engine:
                </p>

                <div className="rounded p-4 min-h-[150px] max-h-[300px] overflow-y-auto font-mono text-[11px] space-y-2 border" style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}>
                  {detectedEvents.length === 0 ? (
                    <p className="italic py-4 text-center" style={{ color: "var(--color-text-tertiary)" }}>
                      No violations detected yet. Try switching tabs or pressing Ctrl+C...
                    </p>
                  ) : (
                    detectedEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 leading-relaxed ${
                          evt.includes("CRITICAL") || evt.includes("SCREENSHOT")
                            ? "font-bold"
                            : ""
                        }`}
                        style={{ color: evt.includes("CRITICAL") || evt.includes("SCREENSHOT") ? "var(--color-palette-crimson)" : evt.includes("HIGH") ? "var(--color-accent)" : "var(--color-success)" }}
                      >
                        <span className="shrink-0">›</span>
                        <span>{evt}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-6 pt-2">
          {/* Rules & Format List */}
          <ul className="space-y-4 max-w-2xl">
            <li className="flex flex-col gap-1 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>1. Per-Question Timer</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Each question has a strict countdown (e.g. 30s) and auto-submits on expiry.
              </p>
            </li>
            <li className="flex flex-col gap-1 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>2. Speed Multiplier</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                50% base score + up to 50% extra bonus points awarded for rapid correct submissions.
              </p>
            </li>
            <li className="flex flex-col gap-1 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>3. Single Attempt</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Questions are presented sequentially. You cannot go back to revise earlier choices.
              </p>
            </li>
            <li className="flex flex-col gap-1 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>4. Round 2 Qualification Criteria</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                At the conclusion of Round 1, all scores will be calibrated against answer speed and violation deductions. 
                The top 50 ranked teams will qualify for Round 2: The Algorithmic Coding Challenge.
              </p>
            </li>
          </ul>
        </div>
      )}

      {/* Checkbox agreement & Launch */}
      <div className="card p-6 rounded-2xl border space-y-4 shadow-sm" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreement"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer mt-0.5"
            style={{ accentColor: "var(--color-palette-crimson)" }}
          />
          <label htmlFor="agreement" className="text-xs font-semibold cursor-pointer select-none leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            I have reviewed the proctoring walkthrough and understand that exiting fullscreen, opening developer tools, switching windows, or unauthorized logins will result in automated penalty strikes or instant disqualification.
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Total Questions in Pool: <strong style={{ color: "var(--color-text-primary)" }}>{totalQuestions} questions</strong>
          </div>

          <button
            onClick={handleEnterFullscreenAndStart}
            disabled={!agreed || !unlocked || starting || Boolean(error)}
            className="btn btn-primary w-full sm:w-auto px-8 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? (
              "Initializing Assessment Engine…"
            ) : !unlocked ? (
              "Round 1 is Currently Locked by Admin"
            ) : (
              <>
                Confirm & Launch Fullscreen Quiz <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
