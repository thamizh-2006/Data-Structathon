import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  getRound1Progress,
  getPublishedRound1Questions,
  getTeamRound1Submissions,
} from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "team") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json({ error: "Disqualified" }, { status: 403 });
  }

  const progress = await getRound1Progress(user.teamId);
  const rawQuestions = await getPublishedRound1Questions();
  const submissions = await getTeamRound1Submissions(user.teamId);

  // Order questions according to progress.question_order
  let questions = rawQuestions;
  if (progress?.is_completed) {
    const allQuestionsAdmin = await import("@/lib/store").then(m => m.getAllRound1QuestionsAdmin());
    questions = allQuestionsAdmin.filter(q => q.is_published);
  }

  if (progress?.question_order && Array.isArray(progress.question_order)) {
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const ordered = progress.question_order.map((id: string) => qMap.get(id)).filter(Boolean);
    if (ordered.length === questions.length) {
      questions = ordered as typeof questions;
    }
  }

  return NextResponse.json({
    progress,
    totalQuestions: questions.length,
    questions,
    submissions,
  });
}
