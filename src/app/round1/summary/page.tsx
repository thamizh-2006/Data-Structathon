"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, CheckCircle2, XCircle, Clock, Award,
  ArrowRight, Sparkles, BarChart3, Home
} from "lucide-react";
import FloatingDSIcons from "@/components/FloatingDSIcons";

export default function Round1SummaryPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    fetch("/api/round1/progress")
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) {
          setProgress(data.progress);
          setTotalQuestions(data.totalQuestions || 0);
          setQuestions(data.questions || []);
          setSubmissions(data.submissions || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Calculating your assessment results…</p>
        </div>
      </div>
    );
  }

  const score = progress?.total_score || 0;
  const correct = progress?.correct_count || 0;
  const incorrect = progress?.incorrect_count || 0;
  const unanswered = Math.max(0, totalQuestions - correct - incorrect);
  const timeTakenSeconds = Math.round((progress?.total_time_ms || 0) / 1000);

  // Pie chart calculation
  const total = totalQuestions || 1;
  const correctPct = (correct / total) * 100;
  const incorrectPct = (incorrect / total) * 100;
  // unanswered is the rest

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-6 select-none participant-protected relative">
      <FloatingDSIcons opacity={0.45} density="normal" />

      {/* Celebration Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 text-center text-white shadow-xl space-y-4"
        style={{
          background: "linear-gradient(135deg, var(--color-palette-espresso) 0%, var(--color-palette-burgundy) 60%, var(--color-palette-crimson) 100%)",
        }}
      >
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/20 backdrop-blur-md">
          <Trophy size={32} className="text-amber-300" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Round 1 Complete!
          </h1>
          <p className="text-indigo-200 text-sm max-w-md mx-auto">
            Your responses have been securely verified and submitted to the leaderboard scoring engine.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white font-bold text-lg">
          <Sparkles className="text-amber-300" size={18} />
          <span>Final Score: {score} pts</span>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 rounded-xl border flex items-center gap-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Correct Answers</p>
            <p className="text-xl font-bold text-slate-900">{correct} / {totalQuestions}</p>
          </div>
        </div>

        <div className="card p-5 rounded-xl border flex items-center gap-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Incorrect / Missed</p>
            <p className="text-xl font-bold text-slate-900">{incorrect}</p>
          </div>
        </div>

        <div className="card p-5 rounded-xl border flex items-center gap-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Time Spent</p>
            <p className="text-xl font-bold text-slate-900">{timeTakenSeconds}s</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="card p-6 rounded-2xl border space-y-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <h3 className="font-bold text-lg text-slate-900 border-b pb-2">Performance Breakdown</h3>
        
        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
          {/* Pie Chart */}
          <div className="relative w-48 h-48 rounded-full border-4 border-slate-100 shadow-inner" style={{ 
            background: `conic-gradient(
              var(--color-success) 0% ${correctPct}%, 
              var(--color-palette-crimson) ${correctPct}% ${correctPct + incorrectPct}%, 
              #cbd5e1 ${correctPct + incorrectPct}% 100%
            )`
          }}>
            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full shadow flex items-center justify-center flex-col">
              <span className="text-2xl font-black text-slate-800">{Math.round((correct/total)*100)}%</span>
              <span className="text-xs text-slate-500 font-medium">Accuracy</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-4 h-4 rounded" style={{ background: "var(--color-success)" }}></div>
              <span className="text-slate-700">Correct ({correct})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-4 h-4 rounded" style={{ background: "var(--color-palette-crimson)" }}></div>
              <span className="text-slate-700">Incorrect ({incorrect})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-4 h-4 bg-slate-300 rounded"></div>
              <span className="text-slate-700">Not Answered ({unanswered})</span>
            </div>
          </div>
        </div>

        {/* Question Map */}
        <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Question Map</h4>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const sub = submissions.find(s => s.question_id === q.id);
              let statusColor = "bg-slate-300 text-slate-600"; // unanswered
              if (sub) {
                statusColor = sub.is_correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
              }
              return (
                <a 
                  key={q.id} 
                  href={`#q-${q.id}`}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm hover:scale-105 transition-transform ${statusColor}`}
                  title={sub ? (sub.is_correct ? "Correct" : "Incorrect") : "Not Answered"}
                >
                  {i + 1}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questions Review Section */}
      <div className="space-y-6">
        <h3 className="font-extrabold text-2xl text-slate-900 border-b pb-2">Review Answers</h3>
        {questions.map((q, i) => {
          const sub = submissions.find(s => s.question_id === q.id);
          const isCorrect = sub?.is_correct;
          const statusText = !sub ? "Not Answered" : isCorrect ? "Correct" : "Incorrect";
          const statusColor = !sub ? "text-slate-500 bg-slate-100" : isCorrect ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100";
          const statusIcon = !sub ? null : isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />;

          return (
            <div key={q.id} id={`q-${q.id}`} className="card p-6 rounded-2xl border space-y-4 shadow-sm scroll-mt-24" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-bold text-slate-800 text-lg leading-snug">{q.question_text}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider ${statusColor}`}>
                  {statusIcon} {statusText}
                </span>
              </div>
              
              <div className="pl-11 space-y-2">
                {q.options?.map((opt: any) => {
                  const selectedIds: string[] = sub?.selected_option_ids || (sub?.selected_option_id ? [sub.selected_option_id] : []);
                  const isSelected = selectedIds.includes(opt.id);
                  const isCorrectOption = Boolean(opt.is_correct);

                  let itemStyle = "bg-white border-slate-200 text-slate-600";
                  let label = null;

                  if (isCorrectOption) {
                    itemStyle = "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-sm";
                    label = (
                      <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {isSelected ? "Your Answer (Correct)" : "Correct Answer"}
                      </span>
                    );
                  } else if (isSelected) {
                    itemStyle = "bg-red-50 border-red-300 text-red-900 font-semibold shadow-sm";
                    label = (
                      <span className="text-xs font-bold uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        Your Answer (Incorrect)
                      </span>
                    );
                  }

                  return (
                    <div 
                      key={opt.id} 
                      className={`p-3 rounded-lg border text-sm flex justify-between items-center transition-all ${itemStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrectOption ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : isSelected ? (
                          <XCircle size={16} className="text-red-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>{opt.option_text}</span>
                      </div>
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Only show explanation if it exists */}
              {q.explanation && (
                <div className="ml-11 p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-900">
                  <span className="font-bold">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/dashboard"
          className="btn btn-outline w-full sm:w-auto px-6 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Home size={16} /> Return to Dashboard
        </Link>
        <Link
          href="/leaderboard"
          className="btn btn-primary w-full sm:w-auto px-6 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
        >
          <BarChart3 size={16} /> View Live Standings <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
