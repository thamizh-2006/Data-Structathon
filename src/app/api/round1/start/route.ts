import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  getRoundById,
  getRound1Progress,
  getPublishedRound1Questions,
} from "@/lib/store";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "team") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json(
      { error: "Your team is disqualified or inactive." },
      { status: 403 }
    );
  }

  const round = await getRoundById(1);
  if (!round?.is_unlocked) {
    return NextResponse.json(
      { error: "Round 1 is not currently unlocked." },
      { status: 403 }
    );
  }

  const questions = await getPublishedRound1Questions();
  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No questions currently published for Round 1." },
      { status: 400 }
    );
  }

  const progress = await getRound1Progress(user.teamId);

  return NextResponse.json({
    started: true,
    progress,
    totalQuestions: questions.length,
  });
}
