"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, Medal, Search, RefreshCw, ArrowLeft,
  Sparkles, CheckCircle2, Building, Flame
} from "lucide-react";
import { LeaderboardEntry } from "@/lib/types";
import FloatingDSIcons from "@/components/FloatingDSIcons";


export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = leaderboard.filter(
    (entry) =>
      entry.team_name.toLowerCase().includes(search.toLowerCase()) ||
      entry.college_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4 animate-fadeIn select-none participant-protected">
      <FloatingDSIcons opacity={0.45} density="normal" />

      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={() => fetchLeaderboard()}
            className="p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Hero Podium Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl text-center space-y-3"
        style={{
          background: "linear-gradient(135deg, var(--color-palette-espresso) 0%, var(--color-palette-burgundy) 60%, var(--color-palette-crimson) 100%)",
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-amber-300">
          <Flame size={14} /> Real-Time Live Standings
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Data Structathon Leaderboard
        </h1>
        <p className="text-indigo-200 text-xs sm:text-sm max-w-lg mx-auto">
          Scores calculate both accuracy and rapid response times. Top 50 qualify for Round 2.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search team or college name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
      </div>

      {/* Leaderboard Table */}
      <div
        className="card rounded-2xl border overflow-hidden shadow-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {loading && leaderboard.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
            Loading live leaderboard…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No participating teams match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className="text-[11px] font-bold uppercase tracking-wider border-b"
                style={{
                  background: "var(--color-surface-2)",
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Team & Institution</th>
                  <th className="py-3.5 px-4 text-center">Round 1</th>
                  <th className="py-3.5 px-4 text-center">Round 2</th>
                  <th className="py-3.5 px-4 text-right">Total Score</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr
                      key={entry.team_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs shadow-xs">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-800 text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Team Name & College */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{entry.team_name}</span>
                          {entry.is_shortlisted && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700"
                              title="Shortlisted for Round 2"
                            >
                              Top 50
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Building size={12} />
                          <span>{entry.college_name}</span>
                        </div>
                      </td>

                      {/* Round 1 Score */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 text-xs">
                        {entry.round1_score} pts
                      </td>

                      {/* Round 2 Score */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 text-xs">
                        {entry.round2_score} pts
                      </td>

                      {/* Total Score */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-indigo-600 text-base">
                          {entry.total_score}
                        </span>
                      </td>

                      {/* Qualification Status */}
                      <td className="py-3.5 px-4 text-center">
                        {entry.is_disqualified ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            Disqualified
                          </span>
                        ) : entry.is_shortlisted ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            Qualified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
