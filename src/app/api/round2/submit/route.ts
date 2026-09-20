import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  getRoundById,
  getProblemTestCasesForGrading,
  recordRound2Submission,
} from "@/lib/store";
import { gradeSubmission, Language, LANGUAGE_IDS } from "@/lib/judge0";

// Find the problem to get time limit and max points
import { getPublishedRound2Problems } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "team") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json(
      { error: "Your team is disqualified." },
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

  let body: { code: string; language: Language; problem_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { code, language, problem_id } = body;

  if (!code || !language || !problem_id) {
    return NextResponse.json(
      { error: "Missing required fields: code, language, problem_id." },
      { status: 400 }
    );
  }

  if (!LANGUAGE_IDS[language]) {
    return NextResponse.json(
      { error: `Unsupported language: ${language}` },
      { status: 400 }
    );
  }

  // Get the problem metadata for scoring
  const problems = await getPublishedRound2Problems();
  const problem = problems.find((p) => p.id === problem_id);
  if (!problem) {
    return NextResponse.json(
      { error: "Problem not found." },
      { status: 404 }
    );
  }

  // Get ALL test cases (including hidden) for full grading
  const allTestCases = await getProblemTestCasesForGrading(problem_id);

  if (allTestCases.length === 0) {
    return NextResponse.json(
      { error: "No test cases found for this problem." },
      { status: 400 }
    );
  }

  // Grade against ALL test cases
  const result = await gradeSubmission(
    code,
    language,
    allTestCases,
    problem.time_limit_ms,
    problem.points
  );

  // Record the submission in the store
  const submission = await recordRound2Submission({
    team_id: user.teamId,
    problem_id,
    code,
    language,
    status: result.overall_status,
    passed_test_cases: result.passed_count,
    total_test_cases: result.total_count,
    score: result.score,
    runtime_ms: result.total_runtime_ms,
    memory_kb: result.total_memory_kb,
    compile_output: result.compile_output,
  });

  // Return results, but REDACT hidden test case details
  return NextResponse.json({
    submission_id: submission.id,
    status: result.overall_status,
    passed: result.passed_count,
    total: result.total_count,
    score: result.score,
    max_score: result.max_score,
    runtime_ms: result.total_runtime_ms,
    memory_kb: result.total_memory_kb,
    compile_output: result.compile_output,
    test_results: result.test_results.map((tr) => ({
      passed: tr.passed,
      status: tr.status,
      runtime_ms: tr.runtime_ms,
      // Only reveal details for non-hidden test cases
      ...(tr.is_hidden
        ? { input: "Hidden", expected_output: "Hidden", actual_output: "Hidden" }
        : {
            input: tr.input,
            expected_output: tr.expected_output,
            actual_output: tr.actual_output,
          }),
    })),
  });
}
