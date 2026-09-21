"use client";

import { useEffect, useState } from "react";
import {
  Search, CheckCircle2, XCircle, ShieldOff, Mail, RotateCcw,
  Edit2, ChevronUp, ChevronDown, Loader2, AlertTriangle,
  Plus, Copy, Eye, EyeOff, X, Trophy, Shield, User,
  ChevronRight,
} from "lucide-react";

interface Team {
  id: string;
  username: string;
  team_name: string;
  college_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  member2_name?: string | null;
  member3_name?: string | null;
  member4_name?: string | null;
  is_shortlisted: boolean;
  is_disqualified: boolean;
  mail_status: "pending" | "sent" | "failed";
}

interface TeamDetail extends Team {
  score?: number;
  violations?: number;
}

type SortKey = "team_name" | "college_name" | "mail_status" | "is_shortlisted";

interface CreatedCredentials {
  team_name: string;
  username: string;
  password: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("team_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Team>>({});
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [confirmDisqualify, setConfirmDisqualify] = useState<Team | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState<Partial<Team>>({});
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<CreatedCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [detailTeam, setDetailTeam] = useState<TeamDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => { setTeams(d.teams || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function patchTeam(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function handleSaveEdit(team: Team) {
    setSaving(true);
    const data = await patchTeam(team.id, editFields);
    setSaving(false);
    if (data.team) {
      setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, ...data.team } : t)));
      setEditId(null);
      showToast("Team updated successfully.", "ok");
    } else {
      showToast(data.error || "Failed to update team.", "err");
    }
  }

  async function handleShortlist(team: Team) {
    setActionLoading(team.id + "_shortlist");
    const data = await patchTeam(team.id, { action: "shortlist", value: !team.is_shortlisted });
    setActionLoading(null);
    if (data.success) {
      setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, is_shortlisted: !t.is_shortlisted } : t)));
      showToast(`${team.team_name} ${team.is_shortlisted ? "removed from" : "added to"} shortlist.`, "ok");
    } else {
      showToast("Failed to update shortlist.", "err");
    }
  }

  async function handleDisqualify() {
    if (!confirmDisqualify) return;
    setActionLoading(confirmDisqualify.id + "_disq");
    const data = await patchTeam(confirmDisqualify.id, {
      action: "disqualify",
      reason: disqualifyReason || "Disqualified by admin.",
    });
    setActionLoading(null);
    setConfirmDisqualify(null);
    setDisqualifyReason("");
    if (data.success) {
      setTeams((prev) => prev.map((t) => (t.id === confirmDisqualify.id ? { ...t, is_disqualified: true } : t)));
      showToast(`${confirmDisqualify.team_name} has been disqualified.`, "ok");
    } else {
      showToast("Failed to disqualify team.", "err");
    }
  }

  async function handleResetPassword(team: Team) {
    if (!confirm(`Reset password for ${team.team_name}?`)) return;
    setActionLoading(team.id + "_pwd");
    const data = await patchTeam(team.id, { action: "reset_password" });
    setActionLoading(null);
    if (data.success) {
      showToast(`Password reset. Email sent to ${team.leader_email}.`, "ok");
    } else {
      showToast(data.error || "Failed to reset password.", "err");
    }
  }

  function validateNewTeam(): boolean {
    const errs: Record<string, string> = {};
    if (!newTeam.team_name?.trim()) errs.team_name = "Team name is required";
    if (!newTeam.college_name?.trim()) errs.college_name = "College name is required";
    if (!newTeam.leader_name?.trim()) errs.leader_name = "Leader name is required";
    if (!newTeam.leader_email?.trim()) errs.leader_email = "Leader email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeam.leader_email)) errs.leader_email = "Invalid email format";
    if (!newTeam.leader_phone?.trim()) errs.leader_phone = "Leader phone is required";
    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreateTeam() {
    if (!validateNewTeam()) return;
    setCreating(true);
    const teamNameClean = newTeam.team_name!.replace(/\s+/g, "").toLowerCase().slice(0, 10);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `team_${teamNameClean}_${randomSuffix}`;
    const password =
      Math.random().toString(36).slice(2, 6) +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      String(Math.floor(10 + Math.random() * 90));
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTeam, username, password }),
      });
      const data = await res.json();
      if (data.team) {
        setTeams((prev) => [...prev, data.team]);
        setShowCreateModal(false);
        setNewTeam({});
        setCreateErrors({});
        setCreatedCreds({ team_name: newTeam.team_name!, username, password });
        setShowPassword(false);
      } else {
        showToast(data.error || "Failed to create team.", "err");
      }
    } catch {
      showToast("Network error while creating team.", "err");
    } finally {
      setCreating(false);
    }
  }

  async function handleViewDetail(team: Team) {
    setDetailTeam(team as TeamDetail);
    setDetailLoading(true);
    try {
      const [scoreRes, vioRes] = await Promise.all([
        fetch(`/api/admin/teams/${team.id}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/admin/violations?teamId=${team.id}`).then((r) => r.json()).catch(() => ({ violations: [] })),
      ]);
      setDetailTeam({
        ...team,
        score: scoreRes.team?.score ?? 0,
        violations: (vioRes.violations || []).length,
      });
    } catch {
      // keep basic info
    } finally {
      setDetailLoading(false);
    }
  }

  function copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = teams
    .filter((t) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        t.team_name.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.college_name.toLowerCase().includes(q) ||
        t.leader_email.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey] as string | boolean;
      const bv = b[sortKey] as string | boolean;
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  }

  const inputCls = (field: string) =>
    `input w-full${createErrors[field] ? " border-red-400" : ""}`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg text-sm font-medium shadow-lg"
          style={{
            background: toast.type === "ok" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: toast.type === "ok" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${toast.type === "ok" ? "var(--color-success-border)" : "var(--color-error-border)"}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Disqualify confirm dialog */}
      {confirmDisqualify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card max-w-sm w-full" style={{ borderRadius: "var(--radius-xl)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-error-bg)" }}
              >
                <AlertTriangle size={18} style={{ color: "var(--color-error)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                  Disqualify Team
                </h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {confirmDisqualify.team_name}
                </p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
              This will immediately block the team and terminate their active session. This action is logged.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                Reason (optional)
              </label>
              <input
                className="input"
                placeholder="e.g. Detected prohibited assistance"
                value={disqualifyReason}
                onChange={(e) => setDisqualifyReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-danger flex-1"
                disabled={actionLoading === confirmDisqualify.id + "_disq"}
                onClick={handleDisqualify}
              >
                {actionLoading === confirmDisqualify.id + "_disq" ? (
                  <><Loader2 size={14} className="animate-spin" /> Disqualifying…</>
                ) : (
                  "Confirm Disqualify"
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setConfirmDisqualify(null); setDisqualifyReason(""); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-lg w-full shadow-2xl" style={{ borderRadius: "var(--radius-xl)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                  }}
                >
                  <Plus size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>
                    Create New Team
                  </h3>
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    Credentials auto-generated — shown after creation
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setNewTeam({}); setCreateErrors({}); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-tertiary)" }}>
              Required Fields
            </p>
            <div className="space-y-3 mb-3">
              <div>
                <input
                  className={inputCls("team_name")}
                  placeholder="Team Name *"
                  value={newTeam.team_name ?? ""}
                  onChange={(e) => { setNewTeam((t) => ({ ...t, team_name: e.target.value })); setCreateErrors((e2) => ({ ...e2, team_name: "" })); }}
                />
                {createErrors.team_name && <p className="text-xs text-red-600 mt-1">{createErrors.team_name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    className={inputCls("college_name")}
                    placeholder="College Name *"
                    value={newTeam.college_name ?? ""}
                    onChange={(e) => { setNewTeam((t) => ({ ...t, college_name: e.target.value })); setCreateErrors((e2) => ({ ...e2, college_name: "" })); }}
                  />
                  {createErrors.college_name && <p className="text-xs text-red-600 mt-1">{createErrors.college_name}</p>}
                </div>
                <div>
                  <input
                    className={inputCls("leader_name")}
                    placeholder="Leader Name *"
                    value={newTeam.leader_name ?? ""}
                    onChange={(e) => { setNewTeam((t) => ({ ...t, leader_name: e.target.value })); setCreateErrors((e2) => ({ ...e2, leader_name: "" })); }}
                  />
                  {createErrors.leader_name && <p className="text-xs text-red-600 mt-1">{createErrors.leader_name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    className={inputCls("leader_email")}
                    placeholder="Leader Email *"
                    type="email"
                    value={newTeam.leader_email ?? ""}
                    onChange={(e) => { setNewTeam((t) => ({ ...t, leader_email: e.target.value })); setCreateErrors((e2) => ({ ...e2, leader_email: "" })); }}
                  />
                  {createErrors.leader_email && <p className="text-xs text-red-600 mt-1">{createErrors.leader_email}</p>}
                </div>
                <div>
                  <input
                    className={inputCls("leader_phone")}
                    placeholder="Leader Phone *"
                    value={newTeam.leader_phone ?? ""}
                    onChange={(e) => { setNewTeam((t) => ({ ...t, leader_phone: e.target.value })); setCreateErrors((e2) => ({ ...e2, leader_phone: "" })); }}
                  />
                  {createErrors.leader_phone && <p className="text-xs text-red-600 mt-1">{createErrors.leader_phone}</p>}
                </div>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-tertiary)" }}>
              Members (Optional)
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <input className="input" placeholder="Member 2" value={newTeam.member2_name ?? ""} onChange={(e) => setNewTeam((t) => ({ ...t, member2_name: e.target.value }))} />
              <input className="input" placeholder="Member 3" value={newTeam.member3_name ?? ""} onChange={(e) => setNewTeam((t) => ({ ...t, member3_name: e.target.value }))} />
              <input className="input" placeholder="Member 4" value={newTeam.member4_name ?? ""} onChange={(e) => setNewTeam((t) => ({ ...t, member4_name: e.target.value }))} />
            </div>

            <div className="flex gap-3">
              <button
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                onClick={handleCreateTeam}
                disabled={creating}
              >
                {creating ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <><Plus size={15} /> Create Team</>}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowCreateModal(false); setNewTeam({}); setCreateErrors({}); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal (after creation) */}
      {createdCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-md w-full shadow-2xl" style={{ borderRadius: "var(--radius-xl)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}
              >
                <CheckCircle2 size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>
                  Team Created Successfully!
                </h3>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{createdCreds.team_name}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4 space-y-4" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
                Login Credentials
              </p>
              {/* Username */}
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Username</p>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <code className="flex-1 text-sm font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {createdCreds.username}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdCreds.username, "username")}
                    className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                    style={{ color: copiedField === "username" ? "var(--color-success)" : "var(--color-text-tertiary)" }}
                    title="Copy"
                  >
                    {copiedField === "username" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              {/* Password */}
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Password</p>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <code className="flex-1 text-sm font-mono font-bold tracking-widest" style={{ color: "var(--color-text-primary)" }}>
                    {showPassword ? createdCreds.password : "••••••••••"}
                  </code>
                  <button
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                    style={{ color: "var(--color-text-tertiary)" }}
                    title={showPassword ? "Hide" : "Reveal"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(createdCreds.password, "password")}
                    className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                    style={{ color: copiedField === "password" ? "var(--color-success)" : "var(--color-text-tertiary)" }}
                    title="Copy"
                  >
                    {copiedField === "password" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center mb-4" style={{ color: "var(--color-text-tertiary)" }}>
              ⚠️ Store these credentials securely — they will not be shown again.
            </p>
            <button className="btn btn-primary w-full" onClick={() => setCreatedCreds(null)}>Done</button>
          </div>
        </div>
      )}

      {/* Team Detail Side Panel */}
      {detailTeam && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
          onClick={() => setDetailTeam(null)}
        >
          <div
            className="w-full max-w-sm h-full shadow-2xl overflow-y-auto flex flex-col"
            style={{ background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: "var(--color-border)", background: "linear-gradient(135deg,#0f172a,#1e1b4b)" }}
            >
              <div>
                <h3 className="font-bold text-base text-white">{detailTeam.team_name}</h3>
                <p className="text-xs text-indigo-300">{detailTeam.college_name}</p>
              </div>
              <button
                onClick={() => setDetailTeam(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-5 space-y-5">
              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                {detailTeam.is_disqualified && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                    <XCircle size={12} /> Disqualified
                  </span>
                )}
                {detailTeam.is_shortlisted && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Shortlisted
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                  detailTeam.mail_status === "sent" ? "bg-sky-100 text-sky-700 border-sky-200" :
                  detailTeam.mail_status === "failed" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }`}>
                  <Mail size={12} /> Email: {detailTeam.mail_status}
                </span>
              </div>

              {/* Stats */}
              {detailLoading ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--color-text-tertiary)" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading stats…</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border text-center" style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                      <Trophy size={16} />
                    </div>
                    <p className="text-xl font-black" style={{ color: "var(--color-text-primary)" }}>{detailTeam.score ?? 0}</p>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>Total Score</p>
                  </div>
                  <div className="p-4 rounded-xl border text-center" style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}>
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                      <Shield size={16} />
                    </div>
                    <p className="text-xl font-black" style={{ color: "var(--color-text-primary)" }}>{detailTeam.violations ?? 0}</p>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>Violations</p>
                  </div>
                </div>
              )}

              {/* Members */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-tertiary)" }}>
                  Team Members
                </p>
                <div className="space-y-2">
                  {[
                    { name: detailTeam.leader_name, role: "Leader", extra: `${detailTeam.leader_email} · ${detailTeam.leader_phone}` },
                    detailTeam.member2_name ? { name: detailTeam.member2_name, role: "Member 2", extra: "" } : null,
                    detailTeam.member3_name ? { name: detailTeam.member3_name, role: "Member 3", extra: "" } : null,
                    detailTeam.member4_name ? { name: detailTeam.member4_name, role: "Member 4", extra: "" } : null,
                  ].filter(Boolean).map((m, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: i === 0 ? "#4f46e5" : "var(--color-border)", color: i === 0 ? "white" : "var(--color-text-secondary)" }}
                      >
                        <User size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{m!.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{m!.role}</p>
                        {m!.extra && <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>{m!.extra}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Login info */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-tertiary)" }}>
                  Login Info
                </p>
                <div className="p-3 rounded-lg" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Username</p>
                  <p className="text-sm font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>{detailTeam.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Teams</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {teams.length} registered teams
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-tertiary)" }} />
            <input
              className="input"
              style={{ paddingLeft: "2.25rem", width: 260 }}
              placeholder="Search by name, username, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary flex items-center gap-1.5"
            onClick={() => { setShowCreateModal(true); setNewTeam({}); setCreateErrors({}); }}
          >
            <Plus size={15} /> Create Team
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
                {[
                  { key: "team_name" as SortKey, label: "Team" },
                  { key: "college_name" as SortKey, label: "College" },
                  { key: "mail_status" as SortKey, label: "Email" },
                  { key: "is_shortlisted" as SortKey, label: "Shortlisted" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left px-4 py-3 font-semibold cursor-pointer select-none"
                    style={{ color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}
                    onClick={() => handleSort(key)}
                  >
                    <span className="flex items-center gap-1">{label} <SortIcon k={key} /></span>
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded animate-pulse" style={{ background: "var(--color-surface-2)", width: "80%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((team) => (
                    <tr
                      key={team.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: team.is_disqualified ? "var(--color-error-bg)" : "var(--color-surface)",
                        opacity: team.is_disqualified ? 0.7 : 1,
                      }}
                    >
                      {/* Team name — clickable for detail */}
                      <td className="px-4 py-3" style={{ minWidth: 180 }}>
                        {editId === team.id ? (
                          <input
                            className="input"
                            style={{ padding: "0.35rem 0.6rem", fontSize: "0.875rem" }}
                            value={editFields.team_name ?? team.team_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, team_name: e.target.value }))}
                          />
                        ) : (
                          <button className="text-left group" onClick={() => handleViewDetail(team)}>
                            <p
                              className="font-semibold flex items-center gap-1 group-hover:underline"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {team.team_name}
                              <ChevronRight
                                size={13}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: "var(--color-accent)" }}
                              />
                            </p>
                            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{team.username}</p>
                          </button>
                        )}
                      </td>

                      {/* College */}
                      <td className="px-4 py-3" style={{ minWidth: 160 }}>
                        {editId === team.id ? (
                          <input
                            className="input"
                            style={{ padding: "0.35rem 0.6rem", fontSize: "0.875rem" }}
                            value={editFields.college_name ?? team.college_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, college_name: e.target.value }))}
                          />
                        ) : (
                          <span style={{ color: "var(--color-text-secondary)" }}>{team.college_name}</span>
                        )}
                      </td>

                      {/* Email status */}
                      <td className="px-4 py-3">
                        <span className={`badge badge-${team.mail_status === "sent" ? "success" : team.mail_status === "failed" ? "error" : "warning"}`}>
                          <Mail size={11} />
                          {team.mail_status}
                        </span>
                      </td>

                      {/* Shortlisted */}
                      <td className="px-4 py-3">
                        <button
                          className={`badge ${team.is_shortlisted ? "badge-success" : "badge-warning"} cursor-pointer border-0`}
                          disabled={actionLoading === team.id + "_shortlist"}
                          onClick={() => handleShortlist(team)}
                          title="Toggle shortlist"
                        >
                          {actionLoading === team.id + "_shortlist"
                            ? <Loader2 size={11} className="animate-spin" />
                            : team.is_shortlisted ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {team.is_shortlisted ? "Yes" : "No"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end flex-wrap">
                          {editId === team.id ? (
                            <>
                              <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => handleSaveEdit(team)}>
                                {saving ? <Loader2 size={13} className="animate-spin" /> : "Save"}
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(null); setEditFields({}); }}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-secondary btn-sm" title="Edit" onClick={() => { setEditId(team.id); setEditFields({}); }}>
                                <Edit2 size={13} /> Edit
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Reset password"
                                disabled={actionLoading === team.id + "_pwd"}
                                onClick={() => handleResetPassword(team)}
                              >
                                {actionLoading === team.id + "_pwd" ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                                Reset Pwd
                              </button>
                              {!team.is_disqualified && (
                                <button className="btn btn-danger btn-sm" title="Disqualify" onClick={() => setConfirmDisqualify(team)}>
                                  <ShieldOff size={13} /> Disqualify
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: "var(--color-text-tertiary)" }}>
              No teams match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
