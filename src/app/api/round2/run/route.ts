import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  getRoundById,
  getProblemTestCasesForGrading,
} from "@/lib/store";
import { gradeSubmission, Language, LANGUAGE_IDS } from "@/lib/judge0";

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

  // Get ONLY sample (non-hidden) test cases for "Run" mode
  const allTestCases = await getProblemTestCasesForGrading(problem_id);
  const sampleTestCases = allTestCases.filter((tc) => !tc.is_hidden);

  if (sampleTestCases.length === 0) {
    return NextResponse.json(
      { error: "No sample test cases found for this problem." },
      { status: 400 }
    );
  }

  // Run against sample test cases only — this is not a graded submission
  const result = await gradeSubmission(code, language, sampleTestCases, 2000, 0);

  // Return results without hiding any test case details (they're all sample)
  return NextResponse.json({
    status: result.overall_status,
    passed: result.passed_count,
    total: result.total_count,
    compile_output: result.compile_output,
    test_results: result.test_results.map((tr) => ({
      input: tr.input,
      expected_output: tr.expected_output,
      actual_output: tr.actual_output,
      passed: tr.passed,
      runtime_ms: tr.runtime_ms,
      status: tr.status,
    })),
  });
}
