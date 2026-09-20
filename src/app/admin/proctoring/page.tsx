"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, AlertTriangle, Eye, EyeOff, ShieldOff, RefreshCw } from "lucide-react";

interface Violation {
  id: string;
  team_id: string;
  team_name?: string;
  round_id: number;
  violation_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  snapshot_url?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const VIOLATION_LABELS: Record<string, string> = {
  FULLSCREEN_EXIT: "Left Fullscreen",
  TAB_SWITCH: "Tab Switch",
  WINDOW_BLUR: "Window Lost Focus",
  COPY_PASTE: "Copy / Paste",
  BLOCKED_SHORTCUT: "Blocked Shortcut",
  DEVTOOLS_ATTEMPT: "DevTools Attempt",
  SCREENSHOT_ATTEMPT: "Screenshot Attempt",
};

export default function AdminProctorPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchViolations = useCallback(async () => {
    const res = await fetch("/api/admin/violations?limit=300");
    const data = await res.json();
    setViolations(data.violations || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  // Poll every 5s when auto-refresh is on (Realtime subscription preferred for production)
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchViolations, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchViolations]);

  const filtered = filter === "ALL" ? violations : violations.filter((v) => v.severity === filter);

  // Group by team
  const byTeam: Record<string, { team_name: string; violations: Violation[] }> = {};
  filtered.forEach((v) => {
    if (!byTeam[v.team_id]) byTeam[v.team_id] = { team_name: v.team_name || v.team_id, violations: [] };
    byTeam[v.team_id].violations.push(v);
  });

  const sortedTeams = Object.entries(byTeam).sort((a, b) => {
    const aHighest = a[1].violations.findIndex((v) => v.severity === "HIGH") !== -1 ? 0 : 1;
    const bHighest = b[1].violations.findIndex((v) => v.severity === "HIGH") !== -1 ? 0 : 1;
    if (aHighest !== bHighest) return aHighest - bHighest;
    return b[1].violations.length - a[1].violations.length;
  });

  const totalHigh = violations.filter((v) => v.severity === "HIGH").length;
  const totalMed = violations.filter((v) => v.severity === "MEDIUM").length;
  const totalLow = violations.filter((v) => v.severity === "LOW").length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Snapshot lightbox */}
      {expandedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedSnapshot(null)}>
          <img src={expandedSnapshot} alt="Screenshot evidence"
            className="max-w-2xl w-full max-h-[80vh] rounded-xl object-contain"
            style={{ boxShadow: "0 0 60px rgba(0,0,0,0.8)" }} />
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Shield size={22} style={{ color: "var(--color-accent)" }} /> Live Proctoring Monitor
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {violations.length} total events &mdash; {Object.keys(byTeam).length} teams flagged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className={`btn btn-sm ${autoRefresh ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setAutoRefresh((v) => !v)}>
            <RefreshCw size={13} className={autoRefresh ? "animate-spin" : ""} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
        </div>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "HIGH", count: totalHigh, cls: "severity-high", filter: "HIGH" as const },
          { label: "MEDIUM", count: totalMed, cls: "severity-medium", filter: "MEDIUM" as const },
          { label: "LOW", count: totalLow, cls: "severity-low", filter: "LOW" as const },
        ].map(({ label, count, cls, filter: f }) => (
          <button key={label}
            className={`card text-center cursor-pointer transition-all ${
              filter === f ? "ring-2 ring-offset-1" : ""
            }`}
            style={{
              padding: "1rem",
              borderColor: filter === f ? (label === "HIGH" ? "#ef4444" : label === "MEDIUM" ? "#f59e0b" : "#0ea5e9") : undefined,
            }}
            onClick={() => setFilter(filter === f ? "ALL" : f)}>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{count}</p>
            <span className={`badge ${cls} mt-1`}>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-16" style={{ color: "var(--color-text-tertiary)" }}>
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          Loading violations…
        </div>
      ) : sortedTeams.length === 0 ? (
        <div className="card text-center py-16">
          <Shield size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-tertiary)" }} />
          <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>No violations recorded</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {filter !== "ALL" ? `No ${filter} severity violations.` : "The exam is running cleanly."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedTeams.map(([teamId, { team_name, violations: tvs }]) => {
            const hasHigh = tvs.some((v) => v.severity === "HIGH");
            return (
              <div key={teamId} className="card" style={{
                borderLeft: `4px solid ${hasHigh ? "var(--color-error)" : "var(--color-warning)"}`,
                padding: "1.25rem",
              }}>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-3">
                    {hasHigh && <AlertTriangle size={16} style={{ color: "var(--color-error)", flexShrink: 0 }} />}
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>{team_name}</h3>
                      <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        {tvs.length} event{tvs.length !== 1 ? "s" : ""} —
                        {tvs.filter((v) => v.severity === "HIGH").length > 0 &&
                          ` ${tvs.filter((v) => v.severity === "HIGH").length} HIGH,`}
                        {tvs.filter((v) => v.severity === "MEDIUM").length > 0 &&
                          ` ${tvs.filter((v) => v.severity === "MEDIUM").length} MEDIUM,`}
                        {tvs.filter((v) => v.severity === "LOW").length > 0 &&
                          ` ${tvs.filter((v) => v.severity === "LOW").length} LOW`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/admin/teams`} className="btn btn-secondary btn-sm">
                      View Team
                    </a>
                    <button className="btn btn-danger btn-sm"
                      onClick={async () => {
                        if (confirm(`Disqualify ${team_name} for violations?`)) {
                          await fetch(`/api/admin/teams/${teamId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "disqualify", reason: "Disqualified for exam violations." }),
                          });
                          alert("Team disqualified.");
                        }
                      }}>
                      <ShieldOff size={13} /> Disqualify
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {tvs.slice(0, 10).map((v) => (
                    <div key={v.id} className="flex items-center gap-3 text-xs p-2.5 rounded-lg"
                      style={{ background: "var(--color-surface-2)" }}>
                      <span className={`badge ${v.severity === "HIGH" ? "severity-high" : v.severity === "MEDIUM" ? "severity-medium" : "severity-low"}`}
                        style={{ fontSize: "0.7rem" }}>
                        {v.severity}
                      </span>
                      <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                        {VIOLATION_LABELS[v.violation_type] || v.violation_type}
                      </span>
                      <span style={{ color: "var(--color-text-tertiary)" }}>
                        Round {v.round_id} · {new Date(v.created_at).toLocaleTimeString()}
                      </span>
                      {v.snapshot_url && (
                        <button className="ml-auto btn btn-ghost btn-sm" style={{ padding: "0.15rem 0.4rem" }}
                          onClick={() => setExpandedSnapshot(
                            expandedSnapshot === v.id ? null : v.snapshot_url!
                          )}>
                          {expandedSnapshot === v.id ? <EyeOff size={12} /> : <Eye size={12} />}
                          Screenshot
                        </button>
                      )}
                    </div>
                  ))}
                  {tvs.length > 10 && (
                    <p className="text-xs text-center" style={{ color: "var(--color-text-tertiary)" }}>
                      +{tvs.length - 10} more events
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
