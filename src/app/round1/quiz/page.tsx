"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProctorGuard from "@/components/ProctorGuard";
import {
  Clock, Award, AlertTriangle, CheckCircle2, ChevronRight,
  Shield, Maximize2, Zap
} from "lucide-react";
import FloatingDSIcons from "@/components/FloatingDSIcons";

interface Option {
  id: string;
  option_text: string;
}

interface Question {
  id: string;
  question_text: string;
  options: Option[];
  time_limit_seconds: number;
  base_points: number;
  question_type?: 'single' | 'multi';
  correct_count?: number;
}

export default function Round1QuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [remainingMs, setRemainingMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [teamId, setTeamId] = useState("");
  const [violationNotice, setViolationNotice] = useState<string | null>(null);
  const [questionStatuses, setQuestionStatuses] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current question from server
  const fetchCurrentQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/round1/question");
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        router.replace("/login");
        return;
      }

      if (data.status === "completed") {
        router.replace("/round1/summary");
        return;
      }

      if (data.question) {
        setQuestion(data.question);
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        setRemainingMs(data.remainingMs || data.question.time_limit_seconds * 1000);
        setUserScore(data.progress?.total_score || 0);
        setSelectedOptionIds([]);
        if (data.questionStatuses) setQuestionStatuses(data.questionStatuses);
      }
    } catch (err) {
      console.error("Failed to fetch question", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load user session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated || d.role !== "team") {
          router.replace("/login");
          return;
        }
        setTeamId(d.teamId || "active_team");
      });

    fetchCurrentQuestion();
  }, [router, fetchCurrentQuestion]);

  // Visual Feedback States
  const [showWrongEdge, setShowWrongEdge] = useState(false);
  const [showRightCelebration, setShowRightCelebration] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [scoreSnapshot, setScoreSnapshot] = useState(0);

  // Trigger celebration from left and right edges
  const triggerSideCelebration = useCallback(async () => {
    try {
      const confettiModule = await import("canvas-confetti");
      const confetti = confettiModule.default || confettiModule;

      // Left side cannon
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ["#8B0000", "#5B0202", "#EDE7C7", "#d97706", "#15803d"],
      });
      // Right side cannon
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ["#8B0000", "#5B0202", "#EDE7C7", "#d97706", "#15803d"],
      });
    } catch {
      // Fallback silently
    }
  }, []);

  // Submit Answer with feedback animation
  const submitAnswer = useCallback(
    async (optionIds: string[] = selectedOptionIds) => {
      if (submitting || !question) return;
      setSubmitting(true);

      try {
        const res = await fetch("/api/round1/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: question.id,
            selected_option_ids: optionIds,
          }),
        });

        const data = await res.json();

        if (data.isCorrect) {
          const earned = data.pointsEarned ?? data.pointsAwarded ?? (question.base_points || 100);
          const newTotal = data.newScore ?? data.progress?.total_score ?? (userScore + earned);
          setPointsEarned(earned);
          setScoreSnapshot(newTotal);
          setUserScore(newTotal);
          setShowRightCelebration(true);
          triggerSideCelebration();

          // Show the white popup for 2.5 seconds, then fade out and advance
          await new Promise((r) => setTimeout(r, 2500));
          setShowRightCelebration(false);
          setPointsEarned(null);
          await new Promise((r) => setTimeout(r, 300)); // brief fade
        } else {
          setShowWrongEdge(true);
          await new Promise((r) => setTimeout(r, 1800));
          setShowWrongEdge(false);
        }

        // Update score from response
        if (data.newScore !== undefined) {
          setUserScore(data.newScore);
        } else if (data.progress?.total_score !== undefined) {
          setUserScore(data.progress.total_score);
        }

        if (data.isCompleted) {
          router.replace("/round1/summary");
        } else {
          await fetchCurrentQuestion();
        }
      } catch (err) {
        console.error("Failed to submit answer", err);
      } finally {
        setSubmitting(false);
      }
    },
    [question, selectedOptionIds, submitting, router, fetchCurrentQuestion, triggerSideCelebration, userScore]
  );


  // Local Countdown Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!question || remainingMs <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current!);
          // Time expired — auto-submit null/current answer
          submitAnswer(selectedOptionIds);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, submitAnswer, selectedOptionIds]);

  function handleViolation(type: string, severity: string) {
    setViolationNotice(`Integrity Alert: ${type.replace(/_/g, " ")} detected (${severity})`);
    setTimeout(() => setViolationNotice(null), 4000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Syncing with quiz engine…</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-lg font-bold text-slate-900">Question Unavailable</h2>
        <p className="text-sm text-slate-500">Could not retrieve the current assessment question.</p>
      </div>
    );
  }

  const secondsRemaining = Math.ceil(remainingMs / 1000);
  const totalSeconds = question.time_limit_seconds || 30;
  const timerPercentage = Math.max(0, (secondsRemaining / totalSeconds) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 select-none relative">
      {/* Floating DS decorations on the sides */}
      <FloatingDSIcons opacity={0.45} density="normal" />

      {/* Wrong Answer Red Screen-Edge Highlight */}
      {showWrongEdge && <div className="wrong-answer-vignette" />}

      {/* Correct Answer Full-Screen White Overlay */}
      {showRightCelebration && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.98)",
            animation: "fadeIn 0.25s ease",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="flex flex-col items-center gap-5 text-center px-6">
            {/* Checkmark */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/15"
              style={{ background: "#f0fdf4", border: "3.5px solid #16a34a" }}
            >
              <CheckCircle2 size={46} color="#16a34a" />
            </div>

            <p className="text-lg font-extrabold tracking-widest uppercase" style={{ color: "#0f172a" }}>
              Correct Answer!
            </p>

            {/* Points earned — big green */}
            {pointsEarned !== null && (
              <div
                className="font-black leading-none drop-shadow-sm"
                style={{ fontSize: "clamp(5.5rem, 16vw, 9.5rem)", color: "#16a34a", lineHeight: 1 }}
              >
                +{pointsEarned}
              </div>
            )}

            <p className="text-base font-semibold uppercase tracking-wider text-xs" style={{ color: "#64748b" }}>
              points earned
            </p>

            {/* Running total */}
            <div
              className="mt-2 px-6 py-2 rounded-full text-sm font-bold shadow-sm"
              style={{ background: "#f0fdf4", color: "#15803d", border: "1.5px solid #bbf7d0" }}
            >
              Total Score: {scoreSnapshot} pts
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Guard */}

      <ProctorGuard teamId={teamId} roundId={1} onViolation={handleViolation} />

      {/* Violation toast */}
      {violationNotice && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <AlertTriangle size={16} />
          {violationNotice}
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        {questionStatuses.map((status, i) => {
          let bg = "#e2e8f0";
          let textColor = "#334155";
          let border = "1px solid #cbd5e1";
          if (status === "correct") {
            bg = "#16a34a";
            textColor = "#ffffff";
            border = "1px solid #15803d";
          } else if (status === "incorrect") {
            bg = "#dc2626";
            textColor = "#ffffff";
            border = "1px solid #b91c1c";
          } else if (status === "partial") {
            bg = "#ca8a04";
            textColor = "#ffffff";
            border = "1px solid #a16207";
          }
          const isCurrent = i === questionIndex;
          return (
            <div
              key={i}
              className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-all ${isCurrent ? 'ring-2 ring-offset-2 ring-indigo-600 scale-105' : 'opacity-90'}`}
              style={{ background: bg, color: textColor, border }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Top Bar: Progress & Big Circular Timer */}
      <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
            Question {questionIndex + 1} <span style={{ color: "var(--color-text-tertiary)" }}>/ {totalQuestions}</span>
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <Zap size={13} style={{ color: "var(--color-accent)" }} />
            <span style={{ color: "var(--color-text-primary)" }}>{userScore} pts</span>
          </div>
          {question.question_type === 'multi' && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
              Select {question.correct_count || 1} option{(question.correct_count || 1) > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Big Circular Timer on Top Right */}
        <div className="relative flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - timerPercentage / 100)}
              className={`transition-all duration-1000 ease-linear ${
                secondsRemaining <= 5 ? "text-red-500 animate-pulse" : "text-indigo-600"
              }`}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span
              className={`font-mono text-base font-black leading-none ${
                secondsRemaining <= 5 ? "text-red-600 animate-pulse" : "text-slate-800 dark:text-slate-100"
              }`}
            >
              {secondsRemaining}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">sec</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="space-y-2 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
          Algorithmic Assessment
        </span>
        <h2 className="text-xl lg:text-2xl font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {question.question_text}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options?.map((opt, i) => {
          const isSelected = selectedOptionIds.includes(opt.id);
          const isMulti = question.question_type === 'multi';
          const maxAllowed = question.correct_count || 1;

          return (
            <button
              key={opt.id}
              disabled={submitting}
              onClick={() => {
                if (isMulti) {
                  setSelectedOptionIds((prev) => {
                    if (prev.includes(opt.id)) {
                      return prev.filter((id) => id !== opt.id);
                    }
                    if (prev.length >= maxAllowed) {
                      return prev; // Block selecting more than allowed
                    }
                    return [...prev, opt.id];
                  });
                } else {
                  setSelectedOptionIds([opt.id]);
                }
              }}
              className="w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4"
              style={{
                background: isSelected ? "var(--color-accent-light)" : "var(--color-surface)",
                borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0 transition-colors"
                style={{
                  background: isSelected ? "var(--color-accent)" : "var(--color-surface-2)",
                  color: isSelected ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {opt.option_text}
              </span>
              <div
                className={`ml-auto flex items-center justify-center shrink-0 transition-colors ${isMulti ? 'w-5 h-5 rounded' : 'w-4 h-4 rounded-full'} border-2`}
                style={{ borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)" }}
              >
                {isSelected && <div className={isMulti ? "w-3 h-3 rounded-sm" : "w-2 h-2 rounded-full"} style={{ background: "var(--color-accent)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          <Shield size={13} style={{ color: "var(--color-success)" }} />
          <span>ProctorGuard active</span>
        </div>

        <button
          onClick={() => submitAnswer()}
          disabled={selectedOptionIds.length === 0 || submitting}
          className="btn btn-primary px-7 py-2.5 text-sm font-bold flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            "Submitting…"
          ) : (
            <>
              Confirm & Next <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
