"use client";

import { useEffect, useState, useRef } from "react";
import { Lock, Unlock, AlertTriangle, Loader2, CheckCircle2, Pencil, X, Check, Clock } from "lucide-react";

interface Round {
  id: number;
  name: string;
  is_unlocked: boolean;
  duration_minutes: number;
  started_at?: string | null;
}

export default function AdminRoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [confirmRound, setConfirmRound] = useState<{ round: Round; unlock: boolean } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Duration editing state
  const [editingDuration, setEditingDuration] = useState<number | null>(null);
  const [draftDuration, setDraftDuration] = useState<string>("");
  const [savingDuration, setSavingDuration] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/rounds")
      .then((r) => r.json())
      .then((d) => { setRounds(d.rounds || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (confirmRound) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [confirmRound]);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleToggle(round: Round, unlock: boolean) {
    setConfirmRound({ round, unlock });
  }

  async function confirmToggle() {
    if (!confirmRound) return;
    const { round, unlock } = confirmRound;
    setConfirmRound(null);
    setToggling(round.id);

    const res = await fetch("/api/admin/rounds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.id, isUnlocked: unlock }),
    });
    const data = await res.json();
    setToggling(null);

    if (data.round) {
      setRounds((prev) => prev.map((r) => (r.id === round.id ? data.round : r)));
      showToast(
        `Round ${round.id} ${unlock ? "unlocked" : "locked"}. All connected participants have been notified.`,
        "ok"
      );
    } else {
      showToast(data.error || "Failed to update round.", "err");
    }
  }

  function startEditDuration(round: Round) {
    setEditingDuration(round.id);
    setDraftDuration(String(round.duration_minutes));
  }

  function cancelEditDuration() {
    setEditingDuration(null);
    setDraftDuration("");
  }

  async function saveDuration(roundId: number) {
    const mins = parseInt(draftDuration, 10);
    if (isNaN(mins) || mins < 1 || mins > 360) {
      showToast("Duration must be between 1 and 360 minutes.", "err");
      return;
    }
    setSavingDuration(roundId);
    const res = await fetch("/api/admin/rounds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId, duration_minutes: mins }),
    });
    const data = await res.json();
    setSavingDuration(null);

    if (data.round) {
      setRounds((prev) => prev.map((r) => (r.id === roundId ? data.round : r)));
      setEditingDuration(null);
      showToast(`Round ${roundId} duration updated to ${mins} minutes.`, "ok");
    } else {
      showToast(data.error || "Failed to update duration.", "err");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg max-w-xs"
          style={{
            background: toast.type === "ok" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: toast.type === "ok" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${toast.type === "ok" ? "var(--color-success-border)" : "var(--color-error-border)"}`,
          }}>
          <CheckCircle2 size={15} />
          {toast.msg}
        </div>
      )}

      {/* Confirm dialog */}
      <dialog ref={dialogRef} className="card max-w-sm w-full backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        style={{ borderRadius: "var(--radius-xl)", position: "fixed", inset: 0, margin: "auto", zIndex: 50 }}>
        {confirmRound && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: confirmRound.unlock ? "var(--color-accent-light)" : "var(--color-warning-bg)" }}>
                {confirmRound.unlock
                  ? <Unlock size={18} style={{ color: "var(--color-accent)" }} />
                  : <AlertTriangle size={18} style={{ color: "var(--color-warning)" }} />}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {confirmRound.unlock ? "Unlock" : "Lock"} {confirmRound.round.name}?
                </h3>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              {confirmRound.unlock
                ? "All eligible connected participants will be instantly pushed to the round start page via Realtime. This action is logged."
                : "The round will be locked immediately. Participants will no longer be able to access it. This action is logged."}
            </p>
            <div className="flex gap-2">
              <button className={`btn flex-1 ${confirmRound.unlock ? "btn-primary" : "btn-danger"}`}
                onClick={confirmToggle}>
                {confirmRound.unlock ? "Yes, unlock now" : "Yes, lock now"}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmRound(null)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </dialog>

      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Round Controls</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Toggle rounds on or off. Edit duration before unlocking. Unlocking a round instantly pushes a Realtime notification to all eligible participants.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {loading
          ? [1, 2].map((i) => (
              <div key={i} className="card animate-pulse" style={{ minHeight: 140, background: "var(--color-surface-2)" }} />
            ))
          : rounds.map((round) => (
              <div key={round.id} className="card"
                style={{ borderLeft: `4px solid ${round.is_unlocked ? "var(--color-success)" : "var(--color-border-strong)"}` }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: round.is_unlocked ? "var(--color-success-bg)" : "var(--color-surface-2)" }}>
                      {round.is_unlocked
                        ? <Unlock size={22} style={{ color: "var(--color-success)" }} />
                        : <Lock size={22} style={{ color: "var(--color-text-tertiary)" }} />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                        {round.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`badge ${round.is_unlocked ? "badge-success" : "badge-warning"}`}>
                          {round.is_unlocked ? "UNLOCKED" : "LOCKED"}
                        </span>

                        {/* Duration — editable only when locked */}
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} style={{ color: "var(--color-text-tertiary)" }} />
                          {editingDuration === round.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={360}
                                value={draftDuration}
                                onChange={(e) => setDraftDuration(e.target.value)}
                                className="w-16 px-1.5 py-0.5 text-xs rounded border font-mono"
                                style={{
                                  background: "var(--color-surface-2)",
                                  borderColor: "var(--color-border)",
                                  color: "var(--color-text-primary)",
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveDuration(round.id);
                                  if (e.key === "Escape") cancelEditDuration();
                                }}
                              />
                              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>min</span>
                              <button
                                onClick={() => saveDuration(round.id)}
                                disabled={savingDuration === round.id}
                                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80"
                                style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
                                title="Save"
                              >
                                {savingDuration === round.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Check size={12} />}
                              </button>
                              <button
                                onClick={cancelEditDuration}
                                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80"
                                style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                {round.duration_minutes} min
                              </span>
                              {!round.is_unlocked && (
                                <button
                                  onClick={() => startEditDuration(round)}
                                  className="w-5 h-5 rounded flex items-center justify-center hover:opacity-80"
                                  style={{ color: "var(--color-text-tertiary)" }}
                                  title="Edit duration"
                                >
                                  <Pencil size={11} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {round.started_at && (
                          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                            Started: {new Date(round.started_at).toLocaleTimeString()}
                          </span>
                        )}
                        {round.id === 2 && (
                          <span className="badge badge-info">Shortlisted teams only</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`btn ${round.is_unlocked ? "btn-danger" : "btn-primary"}`}
                    disabled={toggling === round.id || editingDuration === round.id}
                    onClick={() => handleToggle(round, !round.is_unlocked)}>
                    {toggling === round.id ? (
                      <><Loader2 size={16} className="animate-spin" /> Updating…</>
                    ) : round.is_unlocked ? (
                      <><Lock size={16} /> Lock Round</>
                    ) : (
                      <><Unlock size={16} /> Unlock Round</>
                    )}
                  </button>
                </div>

                <hr className="divider" />
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  {round.id === 1
                    ? "Unlocking this round will immediately notify all registered, non-disqualified teams."
                    : "Unlocking Round 2 only grants access to teams marked as Shortlisted. Edit the duration above before unlocking — once started, the timer cannot be changed."}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}
