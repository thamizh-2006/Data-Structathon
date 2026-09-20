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
  const questions = await getPublishedRound1Questions();
  const submissions = await getTeamRound1Submissions(user.teamId);

  return NextResponse.json({
    progress,
    totalQuestions: questions.length,
    questions,
    submissions,
  });
}
