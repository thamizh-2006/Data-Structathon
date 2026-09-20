"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award, ArrowRight, ShieldCheck, CheckCircle2, Lock, Unlock, AlertTriangle
} from "lucide-react";
import FloatingDSIcons from "@/components/FloatingDSIcons";

interface TeamData {
  team_name: string;
  college_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  member2_name: string | null;
  member3_name: string | null;
  member4_name: string | null;
  is_shortlisted: boolean;
  is_disqualified: boolean;
}

export default function ParticipantDashboardPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [r1Progress, setR1Progress] = useState<any>(null);
  const [round1Unlocked, setRound1Unlocked] = useState(true);
  const [round2Unlocked, setRound2Unlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, qRes, roundsRes] = await Promise.all([
          fetch("/api/auth/me").then((r) => r.json()),
          fetch("/api/round1/question").then((r) => r.json()).catch(() => ({})),
          fetch("/api/rounds").then((r) => r.json()).catch(() => ({ rounds: [] })),
        ]);

        if (meRes.authenticated && meRes.team) {
          const t = meRes.team;
          setTeam({
            team_name: t.team_name,
            college_name: t.college_name,
            leader_name: t.leader_name || "Team Leader",
            leader_email: t.leader_email || "N/A",
            leader_phone: t.leader_phone || "N/A",
            member2_name: t.member2_name,
            member3_name: t.member3_name,
            member4_name: t.member4_name,
            is_shortlisted: t.is_shortlisted,
            is_disqualified: t.is_disqualified,
          });
        }

        if (qRes.progress) setR1Progress(qRes.progress);

        const apiRounds = roundsRes.rounds || [];
        setRound1Unlocked(apiRounds.find((r: any) => r.id === 1)?.is_unlocked ?? true);
        setRound2Unlocked(apiRounds.find((r: any) => r.id === 2)?.is_unlocked ?? false);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  const members = [
    { role: "Leader", name: team?.leader_name, email: team?.leader_email },
    { role: "Member 2", name: team?.member2_name },
    { role: "Member 3", name: team?.member3_name },
    { role: "Member 4", name: team?.member4_name },
  ].filter((m) => m.name);

  const canEnterRound2 = team?.is_shortlisted && round2Unlocked;

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-fadeIn py-6 relative">
      <FloatingDSIcons opacity={0.45} density="normal" />

      {/* Header */}
      <div>
        <p className="text-sm font-bold tracking-wide uppercase mb-2" style={{ color: "var(--color-palette-crimson)" }}>
          Welcome back to the arena!
        </p>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-accent)" }}>
          Data Structathon 2026
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          {team?.team_name}
        </h1>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {team?.college_name}
          {team?.is_shortlisted && (
            <span className="ml-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
              <CheckCircle2 size={11} /> Shortlisted for Round 2
            </span>
          )}
          {team?.is_disqualified && (
            <span className="ml-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>
              <AlertTriangle size={11} /> Disqualified
            </span>
          )}
        </p>
      </div>

      {/* Rounds */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--color-text-tertiary)" }}>
          Competition Rounds
        </p>

        {/* Round 1 */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between py-6 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-accent)" }}>Round 1</span>
              {round1Unlocked
                ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>Open</span>
                : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-2)", color: "var(--color-text-tertiary)" }}>Locked</span>}
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Rapid MCQ Quiz</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Timed DSA multiple-choice questions. Speed earns bonus points. Single attempt only.
            </p>
            {r1Progress?.is_completed && (
              <p className="text-sm font-semibold flex items-center gap-1.5 pt-1" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 size={15} /> Completed — {r1Progress.total_score} pts
              </p>
            )}
          </div>
          <div className="shrink-0 mt-4 sm:mt-0 sm:ml-6 pt-1">
            <Link
              href={r1Progress?.is_completed ? "/round1/summary" : "/round1/start"}
              className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold"
            >
              {r1Progress?.is_completed ? "View Summary" : "Enter"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Round 2 */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between py-6 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-accent)" }}>Round 2</span>
              {canEnterRound2
                ? <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}><Unlock size={11} /> Open</span>
                : <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-2)", color: "var(--color-text-tertiary)" }}><Lock size={11} /> {team?.is_shortlisted ? "Waiting for admin unlock" : "Requires shortlisting"}</span>}
            </div>
            <h2 className="text-xl font-bold" style={{ color: canEnterRound2 ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
              Algorithmic Coding Challenge
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              LeetCode-style problems with live code execution. Top 50 shortlisted teams compete.
            </p>
          </div>
          <div className="shrink-0 mt-4 sm:mt-0 sm:ml-6 pt-1">
            {canEnterRound2 ? (
              <Link href="/round2/start" className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold">
                Enter <ArrowRight size={14} />
              </Link>
            ) : (
              <span className="text-sm font-medium px-3 py-1.5 rounded-md border" style={{ color: "var(--color-text-tertiary)", borderColor: "var(--color-border)", background: "var(--color-surface-2)" }}>
                {team?.is_shortlisted ? "Locked by admin" : "Not shortlisted"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Team */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--color-text-tertiary)" }}>
          Team Roster
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((member, i) => (
            <div key={i} className="p-4 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)" }}>
                  {member.role}
                </span>
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{member.name}</p>
                {member.email && member.email !== "N/A" && (
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{member.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integrity notice — minimal */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
        <ShieldCheck size={12} className="inline mr-1" style={{ color: "var(--color-accent)" }} />
        Exams are proctored. Switching tabs, exiting fullscreen, or using devtools triggers automated violation logs and may result in disqualification.
      </p>
    </div>
  );
}
