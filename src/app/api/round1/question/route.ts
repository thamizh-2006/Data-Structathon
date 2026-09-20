import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  validateSession,
  getRoundById,
  getRound1Progress,
  getPublishedRound1Questions,
} from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "team") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json({ error: "Unauthorized or disqualified" }, { status: 403 });
  }

  const round = await getRoundById(1);
  if (!round?.is_unlocked) {
    return NextResponse.json({ error: "Round 1 is not yet unlocked." }, { status: 403 });
  }

  const progress = await getRound1Progress(user.teamId);
  const questions = await getPublishedRound1Questions();

  if (progress.is_completed) {
    return NextResponse.json({ status: "completed", progress, total: questions.length });
  }

  const idx = progress.current_question_index;
  if (idx >= questions.length) {
    return NextResponse.json({ status: "completed", progress, total: questions.length });
  }

  // Return question WITHOUT is_correct — RLS enforced server-side
  const q = questions[idx];
  const safeQuestion = {
    ...q,
    options: q.options?.map((o) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_correct, ...safe } = o;
      return safe;
    }),
  };

  const now = Date.now();
  const startedAt = progress.question_started_at
    ? new Date(progress.question_started_at).getTime()
    : now;
  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, q.time_limit_seconds * 1000 - elapsed);

  return NextResponse.json({
    status: "active",
    question: safeQuestion,
    questionIndex: idx,
    totalQuestions: questions.length,
    remainingMs: remaining,
    progress,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "team") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const round = await getRoundById(1);
  if (!round?.is_unlocked) {
    return NextResponse.json({ error: "Round 1 is not unlocked." }, { status: 403 });
  }

  const body = await req.json();
  const { question_id, selected_option_id } = body;

  const { submitRound1Answer } = await import("@/lib/store");
  const result = await submitRound1Answer({
    team_id: user.teamId,
    question_id,
    selected_option_id: selected_option_id || null,
  });

  return NextResponse.json({
    success: true,
    isCorrect: result.isCorrect,
    pointsEarned: result.pointsEarned,
    pointsAwarded: result.pointsEarned,
    newScore: result.progress.total_score,
    isCompleted: result.isCompleted,
    progress: result.progress,
  });
}

