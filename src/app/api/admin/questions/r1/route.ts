import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllRound1QuestionsAdmin,
  createRound1Question,
  updateRound1Question,
  deleteRound1Question,
  logAdminAction,
} from "@/lib/store";
import { Round1Question } from "@/lib/types";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// Pre-publish validator
function validateQuestion(data: Partial<Round1Question>): string | null {
  if (!data.question_text?.trim() || data.question_text.trim().length < 10) {
    return "Question text must be at least 10 characters.";
  }
  if (!data.options || data.options.length < 2 || data.options.length > 4) {
    return "Questions must have between 2 and 4 answer options.";
  }
  for (const opt of data.options) {
    if (!opt.option_text?.trim() || opt.option_text.trim().length < 1) {
      return "All option fields must be filled in.";
    }
    const placeholders = ["option", "answer", "choice", "enter"];
    if (placeholders.some((p) => opt.option_text.toLowerCase().startsWith(p))) {
      return `Option "${opt.option_text}" appears to be a placeholder. Please enter actual answer text.`;
    }
  }
  const correctOptions = data.options.filter((o) => o.is_correct);
  if (correctOptions.length !== 1) {
    return "Exactly one correct answer must be selected.";
  }
  if (!data.time_limit_seconds || data.time_limit_seconds < 5) {
    return "Time limit must be at least 5 seconds.";
  }
  return null;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const questions = await getAllRound1QuestionsAdmin();
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { publish, ...questionData } = body;

  // Validate if publishing
  if (publish) {
    const error = validateQuestion(questionData);
    if (error) return NextResponse.json({ error, validationError: true }, { status: 422 });
  }

  const question = await createRound1Question({
    ...questionData,
    is_published: Boolean(publish),
  });

  await logAdminAction({
    admin_username: user.username,
    action: publish ? "PUBLISH_QUESTION" : "SAVE_DRAFT_QUESTION",
    target_type: "round1_question",
    target_id: question.id,
    details: { question_text: question.question_text.substring(0, 80) },
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ question }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, publish, validate_only, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Missing question id" }, { status: 400 });

  // Just validate, don't save (used by admin preview)
  if (validate_only) {
    const error = validateQuestion(updates);
    if (error) return NextResponse.json({ error, validationError: true }, { status: 422 });
    return NextResponse.json({ valid: true });
  }

  if (publish) {
    const error = validateQuestion(updates);
    if (error) return NextResponse.json({ error, validationError: true }, { status: 422 });
  }

  const updated = await updateRound1Question(id, {
    ...updates,
    is_published: Boolean(publish),
  });

  if (!updated) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  await logAdminAction({
    admin_username: user.username,
    action: "EDIT_QUESTION",
    target_type: "round1_question",
    target_id: id,
    details: {},
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ question: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing question id" }, { status: 400 });

  const deleted = await deleteRound1Question(id);

  if (!deleted) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  await logAdminAction({
    admin_username: user.username,
    action: "DELETE_QUESTION",
    target_type: "round1_question",
    target_id: id,
    details: {},
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ success: true });
}
