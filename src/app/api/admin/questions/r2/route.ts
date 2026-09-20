import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllRound2ProblemsAdmin,
  createRound2Problem,
  updateRound2Problem,
  deleteRound2Problem,
  logAdminAction,
} from "@/lib/store";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const problems = await getAllRound2ProblemsAdmin();
  return NextResponse.json({ problems });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { problem, test_cases } = body;

  if (!problem?.title || !problem?.description) {
    return NextResponse.json({ error: "Problem title and description are required." }, { status: 400 });
  }

  const newProblem = await createRound2Problem(problem, test_cases || []);

  await logAdminAction({
    admin_username: user.username,
    action: "CREATE_ROUND2_PROBLEM",
    target_type: "round2_problem",
    target_id: newProblem.id,
    details: { title: newProblem.title },
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ problem: newProblem }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, test_cases, ...problemUpdates } = body;

  if (!id) return NextResponse.json({ error: "Missing problem id" }, { status: 400 });

  const updated = await updateRound2Problem(id, problemUpdates, test_cases);
  if (!updated) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  await logAdminAction({
    admin_username: user.username,
    action: "EDIT_ROUND2_PROBLEM",
    target_type: "round2_problem",
    target_id: id,
    details: { title: updated.title },
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ problem: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing problem id" }, { status: 400 });

  const deleted = await deleteRound2Problem(id);
  if (!deleted) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  await logAdminAction({
    admin_username: user.username,
    action: "DELETE_ROUND2_PROBLEM",
    target_type: "round2_problem",
    target_id: id,
    details: {},
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ success: true });
}

