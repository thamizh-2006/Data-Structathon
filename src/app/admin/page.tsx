"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Lock, Unlock, Shield, Trophy, FileQuestion,
  AlertTriangle, CheckCircle2, Clock, TrendingUp
} from "lucide-react";

interface Stats {
  totalTeams: number;
  shortlisted: number;
  disqualified: number;
  sentEmails: number;
  round1Unlocked: boolean;
  round2Unlocked: boolean;
  totalViolations: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/teams").then((r) => r.json()),
      fetch("/api/admin/rounds").then((r) => r.json()),
      fetch("/api/admin/violations").then((r) => r.json()),
    ]).then(([teamsData, roundsData, violationsData]) => {
      const teams = teamsData.teams || [];
      const rounds = roundsData.rounds || [];
      setStats({
        totalTeams: teams.length,
        shortlisted: teams.filter((t: any) => t.is_shortlisted).length,
        disqualified: teams.filter((t: any) => t.is_disqualified).length,
        sentEmails: teams.filter((t: any) => t.mail_status === "sent").length,
        round1Unlocked: rounds.find((r: any) => r.id === 1)?.is_unlocked ?? false,
        round2Unlocked: rounds.find((r: any) => r.id === 2)?.is_unlocked ?? false,
        totalViolations: (violationsData.violations || []).length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const STAT_CARDS = stats ? [
    { label: "Total Teams", value: stats.totalTeams, icon: Users, color: "#4f46e5", bg: "#eef2ff" },
    { label: "Shortlisted", value: stats.shortlisted, icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Disqualified", value: stats.disqualified, icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
    { label: "Emails Sent", value: stats.sentEmails, icon: CheckCircle2, color: "#0ea5e9", bg: "#f0f9ff" },
    { label: "Violations", value: stats.totalViolations, icon: Shield, color: "#d97706", bg: "#fffbeb" },
  ] : [];

  const QUICK_LINKS = [
    { href: "/admin/teams", label: "Manage Teams", icon: Users, desc: "View, edit, shortlist, or disqualify teams" },
    { href: "/admin/questions", label: "Manage Questions", icon: FileQuestion, desc: "Author and publish Round 1 & Round 2 questions" },
    { href: "/admin/rounds", label: "Round Controls", icon: Lock, desc: "Lock or unlock Round 1 and Round 2" },
    { href: "/admin/proctoring", label: "Live Proctoring", icon: Shield, desc: "Monitor violations in real time" },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, desc: "View live standings across all teams" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Data Structathon 2026 — Command Centre
        </p>
      </div>

      {/* Round Status Banner */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { id: 1, label: "Round 1: MCQ Quiz", unlocked: stats.round1Unlocked },
            { id: 2, label: "Round 2: Coding", unlocked: stats.round2Unlocked },
          ].map(({ id, label, unlocked }) => (
            <div key={id} className="card flex items-center gap-4"
              style={{ borderLeft: `4px solid ${unlocked ? "var(--color-success)" : "var(--color-error)"}` }}>
              {unlocked ? (
                <Unlock size={22} style={{ color: "var(--color-success)", flexShrink: 0 }} />
              ) : (
                <Lock size={22} style={{ color: "var(--color-error)", flexShrink: 0 }} />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                <p className="text-xs" style={{ color: unlocked ? "var(--color-success)" : "var(--color-error)" }}>
                  {unlocked ? "Currently UNLOCKED — active" : "Locked"}
                </p>
              </div>
              <Link href="/admin/rounds" className="btn btn-secondary btn-sm ml-auto flex-shrink-0">
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ minHeight: 90, background: "var(--color-surface-2)" }} />
            ))
          : STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card text-center" style={{ padding: "1.25rem 1rem" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
              </div>
            ))}
      </div>

      {/* Quick Links */}
      <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
        Quick Access
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href} className="card card-hover flex items-start gap-4 no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-accent-light)" }}>
              <Icon size={18} style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
