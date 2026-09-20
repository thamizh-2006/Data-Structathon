"use client";

import { useEffect, useState } from "react";
import {
  Search, CheckCircle2, XCircle, ShieldOff, Mail, RotateCcw,
  Edit2, ChevronUp, ChevronDown, Loader2, AlertTriangle,
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

type SortKey = "team_name" | "college_name" | "mail_status" | "is_shortlisted";

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
      setTeams((prev) =>
        prev.map((t) => (t.id === team.id ? { ...t, is_shortlisted: !t.is_shortlisted } : t))
      );
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
      setTeams((prev) =>
        prev.map((t) => (t.id === confirmDisqualify.id ? { ...t, is_disqualified: true } : t))
      );
      showToast(`${confirmDisqualify.team_name} has been disqualified.`, "ok");
    } else {
      showToast("Failed to disqualify team.", "err");
    }
  }

  async function handleResetPassword(team: Team) {
    if (!confirm(`Reset password for ${team.team_name}? New credentials will be emailed to the team leader.`)) return;
    setActionLoading(team.id + "_pwd");
    const data = await patchTeam(team.id, { action: "reset_password" });
    setActionLoading(null);
    if (data.success) {
      showToast(`Password reset. Email sent to ${team.leader_email}.`, "ok");
    } else {
      showToast(data.error || "Failed to reset password.", "err");
    }
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg"
          style={{
            background: toast.type === "ok" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: toast.type === "ok" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${toast.type === "ok" ? "var(--color-success-border)" : "var(--color-error-border)"}`,
          }}>
          {toast.msg}
        </div>
      )}

      {/* Disqualify confirm dialog */}
      {confirmDisqualify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card max-w-sm w-full" style={{ borderRadius: "var(--radius-xl)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-error-bg)" }}>
                <AlertTriangle size={18} style={{ color: "var(--color-error)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>Disqualify Team</h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{confirmDisqualify.team_name}</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
              This will immediately block the team and terminate their active session. This action is logged.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                Reason (optional)
              </label>
              <input className="input" placeholder="e.g. Detected prohibited assistance"
                value={disqualifyReason}
                onChange={(e) => setDisqualifyReason(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-danger flex-1"
                disabled={actionLoading === confirmDisqualify.id + "_disq"}
                onClick={handleDisqualify}>
                {actionLoading === confirmDisqualify.id + "_disq"
                  ? <><Loader2 size={14} className="animate-spin" /> Disqualifying…</>
                  : "Confirm Disqualify"}
              </button>
              <button className="btn btn-secondary" onClick={() => { setConfirmDisqualify(null); setDisqualifyReason(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Teams</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {teams.length} registered teams
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-text-tertiary)" }} />
          <input className="input" style={{ paddingLeft: "2.25rem", width: 260 }}
            placeholder="Search by name, username, email…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

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
                  <th key={key}
                    className="text-left px-4 py-3 font-semibold cursor-pointer select-none"
                    style={{ color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}
                    onClick={() => handleSort(key)}>
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
                    <tr key={team.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: team.is_disqualified ? "var(--color-error-bg)" : "var(--color-surface)",
                        opacity: team.is_disqualified ? 0.7 : 1,
                      }}>
                      {/* Team Name + username */}
                      <td className="px-4 py-3" style={{ minWidth: 180 }}>
                        {editId === team.id ? (
                          <input className="input" style={{ padding: "0.35rem 0.6rem", fontSize: "0.875rem" }}
                            value={editFields.team_name ?? team.team_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, team_name: e.target.value }))} />
                        ) : (
                          <div>
                            <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{team.team_name}</p>
                            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{team.username}</p>
                          </div>
                        )}
                      </td>

                      {/* College */}
                      <td className="px-4 py-3" style={{ minWidth: 160 }}>
                        {editId === team.id ? (
                          <input className="input" style={{ padding: "0.35rem 0.6rem", fontSize: "0.875rem" }}
                            value={editFields.college_name ?? team.college_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, college_name: e.target.value }))} />
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
                          title="Toggle shortlist">
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
                              <button className="btn btn-secondary btn-sm" title="Edit"
                                onClick={() => { setEditId(team.id); setEditFields({}); }}>
                                <Edit2 size={13} /> Edit
                              </button>
                              <button className="btn btn-secondary btn-sm" title="Reset password"
                                disabled={actionLoading === team.id + "_pwd"}
                                onClick={() => handleResetPassword(team)}>
                                {actionLoading === team.id + "_pwd"
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <RotateCcw size={13} />}
                                Reset Pwd
                              </button>
                              {!team.is_disqualified && (
                                <button className="btn btn-danger btn-sm" title="Disqualify"
                                  onClick={() => setConfirmDisqualify(team)}>
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
