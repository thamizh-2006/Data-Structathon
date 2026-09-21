"use client";

import { useEffect, useState } from "react";
import {
  FileQuestion, Plus, CheckCircle2, Clock,
  Edit2, Trash2, Code2, Sparkles, X, Save, AlertCircle
} from "lucide-react";
import { Round1Question, Round2Problem } from "@/lib/types";

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"] as const;

const defaultR1Form = {
  question_text: "",
  explanation: "",
  time_limit_seconds: 30,
  base_points: 1000,
  question_type: "single" as "single" | "multi",
  options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

const defaultR2Form = {
  title: "",
  description: "",
  difficulty: "Medium" as "Easy" | "Medium" | "Hard",
  time_limit_ms: 2000,
  memory_limit_mb: 256,
  points: 100,
  order_index: 1,
  is_published: false,
  test_cases: [
    { input: "", expected_output: "", is_hidden: false, order_index: 1 },
  ],
};

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<"r1" | "r2">("r1");
  const [r1Questions, setR1Questions] = useState<Round1Question[]>([]);
  const [r2Problems, setR2Problems] = useState<Round2Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [r1ModalOpen, setR1ModalOpen] = useState(false);
  const [r1EditTarget, setR1EditTarget] = useState<Round1Question | null>(null);
  const [r1Form, setR1Form] = useState({ ...defaultR1Form });
  const [submittingR1, setSubmittingR1] = useState(false);

  const [r2ModalOpen, setR2ModalOpen] = useState(false);
  const [r2EditTarget, setR2EditTarget] = useState<Round2Problem | null>(null);
  const [r2Form, setR2Form] = useState({ ...defaultR2Form });
  const [submittingR2, setSubmittingR2] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; round: "r1" | "r2"; title: string } | null>(null);

  useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    setLoading(true);
    try {
      const [r1Res, r2Res] = await Promise.all([
        fetch("/api/admin/questions/r1").then((r) => r.json()),
        fetch("/api/admin/questions/r2").then((r) => r.json()),
      ]);
      setR1Questions(r1Res.questions || []);
      setR2Problems(r2Res.problems || []);
    } catch { showToast("Failed to fetch questions.", "error"); }
    finally { setLoading(false); }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openR1Add() {
    setR1EditTarget(null);
    setR1Form({ ...defaultR1Form, options: defaultR1Form.options.map(o => ({ ...o })) });
    setR1ModalOpen(true);
  }

  function openR1Edit(q: Round1Question) {
    setR1EditTarget(q);
    setR1Form({
      question_text: q.question_text,
      explanation: q.explanation || "",
      time_limit_seconds: q.time_limit_seconds,
      base_points: q.base_points,
      question_type: q.question_type || "single",
      options: (q.options || []).map(o => ({ option_text: o.option_text, is_correct: Boolean(o.is_correct) })),
    });
    setR1ModalOpen(true);
  }

  async function handleTogglePublishR1(q: Round1Question) {
    try {
      const res = await fetch("/api/admin/questions/r1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...q, publish: !q.is_published }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed", "error"); return; }
      showToast(q.is_published ? "Unpublished." : "Published!", "success");
      loadQuestions();
    } catch { showToast("Network error", "error"); }
  }

  async function handleSaveR1(publish = false) {
    if (!r1Form.question_text.trim() || r1Form.question_text.length < 10) {
      showToast("Question text must be at least 10 characters.", "error"); return;
    }
    if (r1Form.options.length < 2) {
      showToast("Please provide at least 2 options.", "error"); return;
    }
    if (r1Form.options.some(o => !o.option_text.trim())) {
      showToast("All options must be filled in.", "error"); return;
    }
    const correctCount = r1Form.options.filter(o => o.is_correct).length;
    if (correctCount < 1) {
      showToast("Please mark at least one option as correct.", "error"); return;
    }
    const question_type = correctCount > 1 ? "multi" : "single";
    r1Form.question_type = question_type;
    setSubmittingR1(true);
    try {
      const method = r1EditTarget ? "PATCH" : "POST";
      const body = r1EditTarget
        ? { id: r1EditTarget.id, ...r1Form, publish }
        : { ...r1Form, order_index: r1Questions.length + 1, publish };
      const res = await fetch("/api/admin/questions/r1", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to save", "error"); return; }
      showToast(r1EditTarget ? "Question updated!" : (publish ? "Published!" : "Draft saved."), "success");
      setR1ModalOpen(false);
      loadQuestions();
    } catch { showToast("Network error", "error"); }
    finally { setSubmittingR1(false); }
  }

  async function handleDeleteR1(id: string) {
    const res = await fetch(`/api/admin/questions/r1?id=${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Question deleted.", "success"); loadQuestions(); }
    else showToast("Failed to delete.", "error");
    setDeleteConfirm(null);
  }

  function openR2Add() {
    setR2EditTarget(null);
    setR2Form({ ...defaultR2Form, order_index: r2Problems.length + 1, test_cases: [{ input: "", expected_output: "", is_hidden: false, order_index: 1 }] });
    setR2ModalOpen(true);
  }

  function openR2Edit(p: Round2Problem) {
    setR2EditTarget(p);
    setR2Form({
      title: p.title,
      description: p.description,
      difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
      time_limit_ms: p.time_limit_ms,
      memory_limit_mb: p.memory_limit_mb,
      points: p.points,
      order_index: p.order_index,
      is_published: p.is_published,
      test_cases: p.test_cases?.map(tc => ({ input: tc.input, expected_output: tc.expected_output, is_hidden: tc.is_hidden, order_index: tc.order_index })) || [{ input: "", expected_output: "", is_hidden: false, order_index: 1 }],
    });
    setR2ModalOpen(true);
  }

  async function handleSaveR2() {
    if (!r2Form.title.trim() || !r2Form.description.trim()) {
      showToast("Title and description are required.", "error"); return;
    }
    setSubmittingR2(true);
    try {
      const { test_cases, ...problem } = r2Form;
      const method = r2EditTarget ? "PATCH" : "POST";
      const body = r2EditTarget
        ? { id: r2EditTarget.id, ...problem, test_cases }
        : { problem, test_cases };
      const res = await fetch("/api/admin/questions/r2", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed", "error"); return; }
      showToast(r2EditTarget ? "Problem updated!" : "Problem created!", "success");
      setR2ModalOpen(false);
      loadQuestions();
    } catch { showToast("Network error", "error"); }
    finally { setSubmittingR2(false); }
  }

  async function handleDeleteR2(id: string) {
    const res = await fetch(`/api/admin/questions/r2?id=${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Problem deleted.", "success"); loadQuestions(); }
    else showToast("Failed to delete.", "error");
    setDeleteConfirm(null);
  }

  const diffColor = (d: string) =>
    d === "Easy" ? { bg: "#dcfce7", text: "#15803d" } :
    d === "Medium" ? { bg: "#fef3c7", text: "#b45309" } :
    { bg: "#fee2e2", text: "#b91c1c" };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-lg shadow-xl text-sm font-medium text-white"
          style={{ background: toast.type === "success" ? "#16a34a" : "#dc2626" }}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: "var(--color-text-primary)" }}>
            <FileQuestion className="text-indigo-600" size={26} /> Question Bank Manager
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Author, inspect, and publish questions for Round 1 &amp; Round 2.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "r1" && (
            <button onClick={openR1Add} className="btn btn-primary flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Add MCQ Question
            </button>
          )}
          {activeTab === "r2" && (
            <button onClick={openR2Add} className="btn btn-primary flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Add Coding Problem
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={() => setActiveTab("r1")}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px transition-all ${activeTab === "r1" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          <Sparkles size={16} /> Round 1: MCQ ({r1Questions.length})
        </button>
        <button onClick={() => setActiveTab("r2")}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px transition-all ${activeTab === "r2" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          <Code2 size={16} /> Round 2: Coding ({r2Problems.length})
        </button>
      </div>

      {activeTab === "r1" && (
        <div className="space-y-4">
          {loading ? <div className="text-center py-16 text-slate-400">Loading…</div>
            : r1Questions.length === 0 ? <div className="text-center py-16 text-slate-400">No questions yet.</div>
            : r1Questions.map((q, idx) => (
              <div key={q.id} className="card p-5 space-y-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}>{idx + 1}</span>
                    <div>
                      <h3 className="font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>{q.question_text}</h3>
                      {q.explanation && <p className="text-xs text-slate-500 mt-1 italic"><span className="font-semibold">Explanation:</span> {q.explanation}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: q.is_published ? "#dcfce7" : "#f1f5f9", color: q.is_published ? "#15803d" : "#64748b" }}>
                      {q.is_published ? "Published" : "Draft"}
                    </span>
                    <button onClick={() => handleTogglePublishR1(q)} className="btn btn-sm btn-outline text-xs">
                      {q.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => openR1Edit(q)} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                      <Edit2 size={15} className="text-indigo-600" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ id: q.id, round: "r1", title: q.question_text.substring(0, 60) })}
                      className="p-1.5 rounded hover:bg-red-50" title="Delete">
                      <Trash2 size={15} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options?.map((opt, oIdx) => (
                    <div key={opt.id || oIdx} className="flex items-center justify-between p-2.5 rounded-lg border text-sm"
                      style={{ background: opt.is_correct ? "rgba(34,197,94,0.05)" : "var(--color-bg)", borderColor: opt.is_correct ? "#86efac" : "var(--color-border)" }}>
                      <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        <span className="text-slate-400 mr-2 font-mono">{String.fromCharCode(65 + oIdx)}.</span>{opt.option_text}
                      </span>
                      {opt.is_correct && <span className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle2 size={13} /> Correct</span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                  <span className="flex items-center gap-1"><Clock size={12} /> {q.time_limit_seconds}s</span>
                  <span>{q.base_points} pts</span>
                  <span>Order: {q.order_index}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {activeTab === "r2" && (
        <div className="space-y-4">
          {loading ? <div className="text-center py-16 text-slate-400">Loading…</div>
            : r2Problems.length === 0 ? <div className="text-center py-16 text-slate-400">No problems yet.</div>
            : r2Problems.map((prob, idx) => {
              const dc = diffColor(prob.difficulty);
              return (
                <div key={prob.id} className="card p-5 space-y-3" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase" style={{ background: dc.bg, color: dc.text }}>{prob.difficulty}</span>
                        <h3 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>{idx + 1}. {prob.title}</h3>
                      </div>
                      <p className="text-sm mt-1.5 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{prob.description}</p>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-semibold text-indigo-600">{prob.points} pts</span>
                        <p className="text-xs text-slate-400">{prob.time_limit_ms}ms | {prob.memory_limit_mb}MB</p>
                      </div>
                      <button onClick={() => openR2Edit(prob)} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                        <Edit2 size={15} className="text-indigo-600" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ id: prob.id, round: "r2", title: prob.title })}
                        className="p-1.5 rounded hover:bg-red-50" title="Delete">
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                    <span>Sample: {prob.test_cases?.filter(t => !t.is_hidden).length || 0}</span>
                    <span>Hidden: {prob.test_cases?.filter(t => t.is_hidden).length || 0}</span>
                    <span className="ml-auto font-mono text-[11px]">ID: {prob.id}</span>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {r1ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {r1EditTarget ? <Edit2 size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />}
                {r1EditTarget ? "Edit MCQ Question" : "Add New MCQ Question"}
              </h2>
              <button onClick={() => setR1ModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Question Text *</label>
                <textarea rows={3} className="input w-full p-2.5 border rounded-lg text-sm"
                  value={r1Form.question_text} onChange={e => setR1Form({ ...r1Form, question_text: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Explanation</label>
                <input type="text" className="input w-full p-2 border rounded-lg text-sm"
                  value={r1Form.explanation} onChange={e => setR1Form({ ...r1Form, explanation: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Time Limit (s)</label>
                  <input type="number" min={5} max={300} className="input w-full p-2 border rounded-lg text-sm"
                    value={r1Form.time_limit_seconds} onChange={e => setR1Form({ ...r1Form, time_limit_seconds: parseInt(e.target.value) || 30 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Base Points</label>
                  <input type="number" min={100} max={5000} className="input w-full p-2 border rounded-lg text-sm"
                    value={r1Form.base_points} onChange={e => setR1Form({ ...r1Form, base_points: parseInt(e.target.value) || 1000 })} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Options — select correct ones</label>
                  <button type="button" className="btn btn-sm btn-outline text-xs flex items-center gap-1"
                    onClick={() => setR1Form({ ...r1Form, options: [...r1Form.options, { option_text: "", is_correct: false }] })}>
                    <Plus size={12} /> Add Option
                  </button>
                </div>
                {r1Form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input type="checkbox" checked={opt.is_correct}
                      onChange={(e) => {
                        const newOpts = [...r1Form.options];
                        newOpts[i].is_correct = e.target.checked;
                        setR1Form({ ...r1Form, options: newOpts });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="font-mono text-xs font-bold text-slate-500 w-5">{String.fromCharCode(65 + i)}</span>
                    <input type="text" className="input flex-1 p-2 border rounded-lg text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt.option_text} onChange={e => {
                        const newOpts = [...r1Form.options];
                        newOpts[i] = { ...newOpts[i], option_text: e.target.value };
                        setR1Form({ ...r1Form, options: newOpts });
                      }} />
                    {r1Form.options.length > 2 && (
                      <button type="button" onClick={() => {
                        const newOpts = [...r1Form.options];
                        newOpts.splice(i, 1);
                        setR1Form({ ...r1Form, options: newOpts });
                      }} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button onClick={() => setR1ModalOpen(false)} className="btn btn-outline text-sm">Cancel</button>
              {!r1EditTarget && (
                <button disabled={submittingR1} onClick={() => handleSaveR1(false)} className="btn btn-secondary text-sm">Save Draft</button>
              )}
              <button disabled={submittingR1} onClick={() => handleSaveR1(true)} className="btn btn-primary text-sm flex items-center gap-2">
                <Save size={14} /> {submittingR1 ? "Saving…" : r1EditTarget ? "Update" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {r2ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {r2EditTarget ? <Edit2 size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />}
                {r2EditTarget ? "Edit Coding Problem" : "Add New Coding Problem"}
              </h2>
              <button onClick={() => setR2ModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Problem Title *</label>
                  <input type="text" className="input w-full p-2.5 border rounded-lg text-sm"
                    value={r2Form.title} onChange={e => setR2Form({ ...r2Form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Difficulty</label>
                  <select className="input w-full p-2 border rounded-lg text-sm" value={r2Form.difficulty}
                    onChange={e => setR2Form({ ...r2Form, difficulty: e.target.value as "Easy" | "Medium" | "Hard" })}>
                    {DIFFICULTY_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Points</label>
                  <input type="number" min={10} max={1000} className="input w-full p-2 border rounded-lg text-sm"
                    value={r2Form.points} onChange={e => setR2Form({ ...r2Form, points: parseInt(e.target.value) || 100 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Time Limit (ms)</label>
                  <input type="number" min={500} className="input w-full p-2 border rounded-lg text-sm"
                    value={r2Form.time_limit_ms} onChange={e => setR2Form({ ...r2Form, time_limit_ms: parseInt(e.target.value) || 2000 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Memory Limit (MB)</label>
                  <input type="number" min={64} className="input w-full p-2 border rounded-lg text-sm"
                    value={r2Form.memory_limit_mb} onChange={e => setR2Form({ ...r2Form, memory_limit_mb: parseInt(e.target.value) || 256 })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description (Markdown) *</label>
                <textarea rows={8} className="input w-full p-2.5 border rounded-lg text-sm font-mono text-xs"
                  value={r2Form.description} onChange={e => setR2Form({ ...r2Form, description: e.target.value })} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Test Cases</label>
                  <button type="button" className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    onClick={() => setR2Form({ ...r2Form, test_cases: [...r2Form.test_cases, { input: "", expected_output: "", is_hidden: false, order_index: r2Form.test_cases.length + 1 }] })}>
                    <Plus size={13} /> Add Test Case
                  </button>
                </div>
                {r2Form.test_cases.map((tc, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2"
                    style={{ borderColor: tc.is_hidden ? "#fecaca" : "var(--color-border)", background: tc.is_hidden ? "#fff5f5" : "var(--color-bg)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Test Case {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={tc.is_hidden}
                            onChange={e => { const tcs = [...r2Form.test_cases]; tcs[i] = { ...tcs[i], is_hidden: e.target.checked }; setR2Form({ ...r2Form, test_cases: tcs }); }} />
                          Hidden
                        </label>
                        {r2Form.test_cases.length > 1 && (
                          <button type="button" onClick={() => setR2Form({ ...r2Form, test_cases: r2Form.test_cases.filter((_, idx) => idx !== i) })}>
                            <X size={14} className="text-red-400 hover:text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Input</p>
                        <textarea rows={2} className="input w-full p-1.5 border rounded text-xs font-mono"
                          value={tc.input} onChange={e => { const tcs = [...r2Form.test_cases]; tcs[i] = { ...tcs[i], input: e.target.value }; setR2Form({ ...r2Form, test_cases: tcs }); }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Expected Output</p>
                        <textarea rows={2} className="input w-full p-1.5 border rounded text-xs font-mono"
                          value={tc.expected_output} onChange={e => { const tcs = [...r2Form.test_cases]; tcs[i] = { ...tcs[i], expected_output: e.target.value }; setR2Form({ ...r2Form, test_cases: tcs }); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={r2Form.is_published}
                  onChange={e => setR2Form({ ...r2Form, is_published: e.target.checked })} className="w-4 h-4" />
                Publish immediately
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button onClick={() => setR2ModalOpen(false)} className="btn btn-outline text-sm">Cancel</button>
              <button disabled={submittingR2} onClick={handleSaveR2} className="btn btn-primary text-sm flex items-center gap-2">
                <Save size={14} /> {submittingR2 ? "Saving…" : r2EditTarget ? "Update Problem" : "Create Problem"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete this?</h3>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{deleteConfirm.title}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline text-sm">Cancel</button>
              <button
                onClick={() => deleteConfirm.round === "r1" ? handleDeleteR1(deleteConfirm.id) : handleDeleteR2(deleteConfirm.id)}
                className="btn text-sm font-semibold text-white"
                style={{ background: "#dc2626" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
