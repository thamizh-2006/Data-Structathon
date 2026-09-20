"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Play, Send, ArrowLeft, ChevronDown, CheckCircle2, XCircle,
  Clock, Cpu, MemoryStick, AlertTriangle, Loader2, Code2,
  FileCode, Terminal, RotateCcw, Eye, EyeOff, Lock
} from "lucide-react";
import confetti from "canvas-confetti";
import ProctorGuard from "@/components/ProctorGuard";

// Dynamic import for Monaco Editor (SSR incompatible)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ background: "#1e1e1e" }}>
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading Monaco Editor…</p>
      </div>
    </div>
  ),
});

type Language = "python" | "javascript" | "cpp" | "java";

const LANGUAGE_CONFIG: Record<Language, { label: string; monacoId: string }> = {
  python: { label: "Python 3", monacoId: "python" },
  javascript: { label: "JavaScript", monacoId: "javascript" },
  cpp: { label: "C++ 17", monacoId: "cpp" },
  java: { label: "Java 17", monacoId: "java" },
};

interface TestCaseView {
  input: string;
  expected_output: string;
}

interface RunResult {
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  runtime_ms: number;
  status: string;
}

interface SubmitResult {
  submission_id: string;
  status: string;
  passed: number;
  total: number;
  score: number;
  max_score: number;
  runtime_ms: number;
  memory_kb: number;
  compile_output: string | null;
  test_results: Array<{
    passed: boolean;
    status: string;
    runtime_ms: number;
    input: string;
    expected_output: string;
    actual_output: string;
  }>;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  points: number;
  order_index: number;
  starter_code: Record<string, string>;
  test_cases: TestCaseView[];
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get("problem");

  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState("");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [violationNotice, setViolationNotice] = useState<string | null>(null);

  // Panels
  const [activePanel, setActivePanel] = useState<"description" | "testcases">("description");
  const [activeOutputTab, setActiveOutputTab] = useState<"result" | "submissions">("result");

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  // Load problem data
  useEffect(() => {
    async function load() {
      if (!problemId) {
        router.replace("/round2/start");
        return;
      }

      try {
        const meRes = await fetch("/api/auth/me").then((r) => r.json());
        if (!meRes.authenticated || meRes.role !== "team") {
          router.replace("/login");
          return;
        }
        setTeamId(meRes.teamId || "active_team");

        const res = await fetch("/api/round2/problems").then((r) => r.json());
        if (res.error) {
          router.replace("/round2/start");
          return;
        }

        const probs: Problem[] = res.problems || [];
        setAllProblems(probs);

        const target = probs.find((p: Problem) => p.id === problemId);
        if (!target) {
          router.replace("/round2/start");
          return;
        }

        setProblem(target);
        setCode(target.starter_code?.python || "# Write your solution here\n");
      } catch {
        router.replace("/round2/start");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [problemId, router]);

  // Switch language → update starter code
  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (problem?.starter_code?.[lang]) {
        setCode(problem.starter_code[lang]);
      }
      setShowLangDropdown(false);
    },
    [problem]
  );

  // Reset code to starter
  const handleReset = useCallback(() => {
    if (problem?.starter_code?.[language]) {
      setCode(problem.starter_code[language]);
    }
    setRunResults(null);
    setSubmitResult(null);
    setCompileError(null);
  }, [problem, language]);

  // Run code (sample test cases only)
  const handleRun = useCallback(async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setRunResults(null);
    setSubmitResult(null);
    setCompileError(null);
    setActiveOutputTab("result");

    try {
      const res = await fetch("/api/round2/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, problem_id: problem.id }),
      });
      const data = await res.json();

      if (data.compile_output) {
        setCompileError(data.compile_output);
      } else {
        setRunResults(data.test_results || []);
      }
    } catch {
      setCompileError("Network error. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, [problem, code, language, isRunning]);

  // Submit code (all test cases)
  const handleSubmit = useCallback(async () => {
    if (!problem || isSubmitting) return;
    setIsSubmitting(true);
    setRunResults(null);
    setSubmitResult(null);
    setCompileError(null);
    setActiveOutputTab("result");

    try {
      const res = await fetch("/api/round2/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, problem_id: problem.id }),
      });
      const data: SubmitResult = await res.json();

      if (data.compile_output) {
        setCompileError(data.compile_output);
      } else {
        setSubmitResult(data);

        // Celebration if all passed!
        if (data.status === "ACCEPTED") {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { x: 0.5, y: 0.6 },
            colors: ["#8B0000", "#EDE7C7", "#15803d", "#fbbf24"],
          });
        }
      }
    } catch {
      setCompileError("Network error during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [problem, code, language, isSubmitting]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+Enter → Run
      if (e.ctrlKey && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleRun();
      }
      // Ctrl+Shift+Enter → Submit
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRun, handleSubmit]);

  function handleViolation(type: string, severity: string) {
    setViolationNotice(`Integrity Alert: ${type.replace(/_/g, " ")} detected (${severity})`);
    setTimeout(() => setViolationNotice(null), 4000);
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      ACCEPTED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Accepted" },
      WRONG_ANSWER: { bg: "bg-rose-50", text: "text-rose-700", label: "Wrong Answer" },
      TIME_LIMIT_EXCEEDED: { bg: "bg-amber-50", text: "text-amber-700", label: "TLE" },
      MEMORY_LIMIT_EXCEEDED: { bg: "bg-purple-50", text: "text-purple-700", label: "MLE" },
      RUNTIME_ERROR: { bg: "bg-orange-50", text: "text-orange-700", label: "Runtime Error" },
      COMPILATION_ERROR: { bg: "bg-red-50", text: "text-red-700", label: "Compile Error" },
    };
    const s = map[status] || { bg: "bg-slate-50", text: "text-slate-600", label: status };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  }

  function getDifficultyStyle(d: string) {
    if (d === "Easy") return { color: "var(--color-easy)" };
    if (d === "Medium") return { color: "var(--color-medium)" };
    return { color: "var(--color-hard)" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="text-center space-y-3">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin mx-auto"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-tertiary)" }}>
            Loading editor…
          </p>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="h-screen flex flex-col participant-protected" style={{ background: "var(--color-bg)" }}>
      {/* Proctoring Guard */}
      {teamId && <ProctorGuard teamId={teamId} roundId={2} onViolation={handleViolation} />}

      {/* Violation toast */}
      {violationNotice && (
        <div className="fixed top-5 right-5 z-[9999] px-4 py-3 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <AlertTriangle size={16} />
          {violationNotice}
        </div>
      )}

      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{
          background: "var(--color-palette-espresso)",
          borderColor: "var(--color-palette-burgundy)",
          color: "var(--color-text-inverse)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/round2/start"
            className="text-xs font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <ArrowLeft size={14} /> Problems
          </Link>
          <span className="text-white/30">|</span>
          <h1 className="text-sm font-bold truncate max-w-[300px]">
            #{problem.order_index} {problem.title}
          </h1>
          <span
            className="text-[10px] font-extrabold tracking-wider px-1.5 py-0.5 rounded"
            style={{
              ...getDifficultyStyle(problem.difficulty),
              background: "rgba(255,255,255,0.1)",
            }}
          >
            {problem.difficulty.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Problem Navigator */}
          {allProblems.length > 1 && (
            <div className="flex items-center gap-1">
              {allProblems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/round2/editor?problem=${p.id}`)}
                  className={`w-7 h-7 rounded text-[10px] font-bold transition-all ${
                    p.id === problem.id
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {p.order_index}
                </button>
              ))}
            </div>
          )}

          {/* Points */}
          <div className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-amber-300">
            {problem.points} pts
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Problem Description + Test Cases */}
        <div
          className="w-[45%] flex flex-col border-r overflow-hidden"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Panel Tabs */}
          <div className="flex border-b shrink-0" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <button
              onClick={() => setActivePanel("description")}
              className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-all ${
                activePanel === "description"
                  ? "border-current"
                  : "border-transparent"
              }`}
              style={{
                color: activePanel === "description" ? "var(--color-accent)" : "var(--color-text-tertiary)",
              }}
            >
              <FileCode size={14} /> Description
            </button>
            <button
              onClick={() => setActivePanel("testcases")}
              className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-all ${
                activePanel === "testcases"
                  ? "border-current"
                  : "border-transparent"
              }`}
              style={{
                color: activePanel === "testcases" ? "var(--color-accent)" : "var(--color-text-tertiary)",
              }}
            >
              <Eye size={14} /> Test Cases ({problem.test_cases?.length || 0})
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activePanel === "description" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded border"
                    style={{
                      ...getDifficultyStyle(problem.difficulty),
                      background: "var(--color-accent-light)",
                      borderColor: "var(--color-accent-border)",
                    }}
                  >
                    {problem.difficulty.toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    Time: {problem.time_limit_ms}ms • Memory: {problem.memory_limit_mb}MB
                  </span>
                </div>

                {/* Render description as formatted text */}
                <div
                  className="prose max-w-none text-base leading-relaxed"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {problem.description.split(/\\n|\n/).map((line, i) => {
                    if (line.startsWith("### ")) {
                      return <h3 key={i} className="font-bold text-base mt-4 mb-2">{line.replace("### ", "")}</h3>;
                    }
                    if (line.startsWith("```")) return null;
                    if (line.startsWith("- ")) {
                      return (
                        <p key={i} className="text-sm pl-4 py-0.5" style={{ color: "var(--color-text-secondary)" }}>
                          • {line.replace("- ", "")}
                        </p>
                      );
                    }
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return (
                      <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {activePanel === "testcases" && (
              <div className="space-y-4">
                {problem.test_cases?.map((tc, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 space-y-3"
                    style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                  >
                    <div className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                      Sample Test Case {idx + 1}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
                          Input
                        </span>
                        <pre
                          className="mt-1 p-2.5 rounded-lg text-xs font-mono whitespace-pre-wrap border"
                          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                        >
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
                          Expected Output
                        </span>
                        <pre
                          className="mt-1 p-2.5 rounded-lg text-xs font-mono whitespace-pre-wrap border"
                          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                        >
                          {tc.expected_output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="p-3 rounded-lg text-xs flex items-center gap-2"
                  style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
                >
                  <Lock size={14} />
                  Hidden test cases are used during submission grading but are not shown here.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b shrink-0"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <Code2 size={14} style={{ color: "var(--color-accent)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>Code Editor</span>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all hover:shadow-sm"
                  style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {LANGUAGE_CONFIG[language].label}
                  <ChevronDown size={12} />
                </button>

                {showLangDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl border z-50 min-w-[160px]"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`w-full px-3 py-2 text-xs text-left transition-all ${
                          lang === language ? "font-bold" : "font-medium"
                        }`}
                        style={{
                          color: lang === language ? "var(--color-accent)" : "var(--color-text-primary)",
                          background: lang === language ? "var(--color-accent-light)" : "transparent",
                        }}
                      >
                        {LANGUAGE_CONFIG[lang].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-2 py-1 rounded text-[11px] font-medium border transition-all hover:shadow-sm flex items-center gap-1"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-tertiary)",
                }}
                title="Reset to starter code"
              >
                <RotateCcw size={12} /> Reset
              </button>

              <button
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 border"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-success)",
                }}
                title="Ctrl+Enter"
              >
                {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                Run
              </button>

              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 text-white transition-all disabled:opacity-50 shadow-sm"
                style={{ background: "var(--color-accent)" }}
                title="Ctrl+Shift+Enter"
              >
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={LANGUAGE_CONFIG[language].monacoId}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
                lineNumbers: "on",
                renderLineHighlight: "gutter",
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                tabSize: 4,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
              }}
            />
          </div>

          {/* Output Panel */}
          <div
            className="h-[220px] border-t flex flex-col shrink-0"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            {/* Output Tabs */}
            <div className="flex items-center gap-0 border-b shrink-0" style={{ borderColor: "var(--color-border)" }}>
              <button
                onClick={() => setActiveOutputTab("result")}
                className={`px-4 py-2 text-[11px] font-bold border-b-2 -mb-px transition-all ${
                  activeOutputTab === "result" ? "border-current" : "border-transparent"
                }`}
                style={{
                  color: activeOutputTab === "result" ? "var(--color-accent)" : "var(--color-text-tertiary)",
                }}
              >
                <Terminal size={12} className="inline mr-1.5" />
                Output
              </button>
            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {/* Compile Error */}
              {compileError && (
                <div
                  className="p-3 rounded-lg border space-y-1"
                  style={{ background: "var(--color-error-bg)", borderColor: "var(--color-error-border)" }}
                >
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: "var(--color-error)" }}>
                    <AlertTriangle size={13} /> Compilation Error
                  </div>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap" style={{ color: "var(--color-error)" }}>
                    {compileError}
                  </pre>
                </div>
              )}

              {/* Run Results */}
              {runResults && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                      Sample Test Results
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        color: runResults.every((r) => r.passed) ? "var(--color-success)" : "var(--color-error)",
                      }}
                    >
                      {runResults.filter((r) => r.passed).length}/{runResults.length} passed
                    </span>
                  </div>
                  {runResults.map((r, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border p-3 space-y-2"
                      style={{
                        background: r.passed ? "var(--color-success-bg)" : "var(--color-error-bg)",
                        borderColor: r.passed ? "var(--color-success-border)" : "var(--color-error-border)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {r.passed ? (
                            <CheckCircle2 size={13} style={{ color: "var(--color-success)" }} />
                          ) : (
                            <XCircle size={13} style={{ color: "var(--color-error)" }} />
                          )}
                          <span className="font-bold text-[11px]" style={{ color: "var(--color-text-primary)" }}>
                            Case {idx + 1}
                          </span>
                          {getStatusBadge(r.status)}
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: "var(--color-text-tertiary)" }}>
                          {r.runtime_ms}ms
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--color-text-tertiary)" }}>Input</span>
                          <code className="font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.input}</code>
                        </div>
                        <div>
                          <span className="font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--color-text-tertiary)" }}>Expected</span>
                          <code className="font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.expected_output}</code>
                        </div>
                        <div>
                          <span className="font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--color-text-tertiary)" }}>Output</span>
                          <code className="font-mono" style={{ color: r.passed ? "var(--color-success)" : "var(--color-error)" }}>
                            {r.actual_output}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Results */}
              {submitResult && (
                <div className="space-y-3">
                  <div
                    className="rounded-xl border p-4 space-y-3"
                    style={{
                      background: submitResult.status === "ACCEPTED" ? "var(--color-success-bg)" : "var(--color-error-bg)",
                      borderColor: submitResult.status === "ACCEPTED" ? "var(--color-success-border)" : "var(--color-error-border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {submitResult.status === "ACCEPTED" ? (
                          <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />
                        ) : (
                          <XCircle size={18} style={{ color: "var(--color-error)" }} />
                        )}
                        <span className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
                          {submitResult.status === "ACCEPTED" ? "All Tests Passed!" : "Submission Result"}
                        </span>
                        {getStatusBadge(submitResult.status)}
                      </div>
                      <span className="font-bold text-sm" style={{ color: "var(--color-accent)" }}>
                        {submitResult.score}/{submitResult.max_score} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} /> {submitResult.passed}/{submitResult.total} test cases
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {submitResult.runtime_ms}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={12} /> {Math.round(submitResult.memory_kb / 1024 * 10) / 10} MB
                      </span>
                    </div>
                  </div>

                  {/* Individual test case results */}
                  <div className="space-y-1.5">
                    {submitResult.test_results.map((tr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border"
                        style={{
                          background: tr.passed ? "var(--color-success-bg)" : "var(--color-error-bg)",
                          borderColor: tr.passed ? "var(--color-success-border)" : "var(--color-error-border)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {tr.passed ? (
                            <CheckCircle2 size={12} style={{ color: "var(--color-success)" }} />
                          ) : (
                            <XCircle size={12} style={{ color: "var(--color-error)" }} />
                          )}
                          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                            Test {idx + 1}
                          </span>
                          {tr.input === "Hidden" && (
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--color-text-tertiary)" }}>
                              <EyeOff size={10} /> Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(tr.status)}
                          <span className="text-[10px] font-mono" style={{ color: "var(--color-text-tertiary)" }}>
                            {tr.runtime_ms}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!compileError && !runResults && !submitResult && (
                <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-tertiary)" }}>
                  <div className="text-center space-y-2">
                    <Terminal size={24} className="mx-auto opacity-30" />
                    <p className="text-[11px]">
                      Press <kbd className="px-1 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "var(--color-border)" }}>Ctrl+Enter</kbd> to run
                      or <kbd className="px-1 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "var(--color-border)" }}>Ctrl+Shift+Enter</kbd> to submit
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Round2EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen" style={{ background: "var(--color-bg)" }}>
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "var(--color-accent)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-tertiary)" }}>
              Initializing Code Arena…
            </p>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
