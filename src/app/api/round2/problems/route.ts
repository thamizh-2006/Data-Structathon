import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  getRoundById,
  getPublishedRound2Problems,
  getTeamRound2Submissions,
} from "@/lib/store";

export async function GET() {
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

  if (!team.is_shortlisted) {
    return NextResponse.json(
      { error: "Round 2 is only open to shortlisted teams. Your Round 1 results are still being evaluated." },
      { status: 403 }
    );
  }

  const round = await getRoundById(2);
  if (!round?.is_unlocked) {
    return NextResponse.json(
      { error: "Round 2 is not currently unlocked." },
      { status: 403 }
    );
  }

  const problems = await getPublishedRound2Problems();

  // Attach submission status per problem for this team
  const problemsWithStatus = await Promise.all(
    problems.map(async (problem) => {
      const submissions = await getTeamRound2Submissions(user.teamId, problem.id);
      const bestSubmission = submissions.length > 0
        ? submissions.reduce((best, sub) =>
            sub.score > best.score ? sub : best
          )
        : null;

      return {
        ...problem,
        submission_count: submissions.length,
        best_score: bestSubmission?.score ?? 0,
        best_status: bestSubmission?.status ?? null,
        last_language: bestSubmission?.language ?? null,
      };
    })
  );

  return NextResponse.json({
    problems: problemsWithStatus,
    round,
    team_name: team.team_name,
  });
}
