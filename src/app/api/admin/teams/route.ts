import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllTeams, updateTeam, logAdminAction } from "@/lib/store";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  const teams = await getAllTeams();
  return NextResponse.json({ teams });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await req.json();
  const {
    team_name, college_name, leader_name, leader_email, leader_phone,
    member2_name, member3_name, member4_name,
    username, password,
  } = body;

  if (!username || !password || !team_name || !leader_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { hashPassword } = await import("@/lib/auth");
  const { createTeam } = await import("@/lib/store");
  const user = await getCurrentUser();

  const newTeam = await createTeam({
    username,
    password_hash: await hashPassword(password),
    team_name,
    college_name,
    leader_name,
    leader_email,
    leader_phone,
    member2_name,
    member3_name,
    member4_name,
    is_shortlisted: false,
    is_disqualified: false,
    mail_status: "pending",
  });

  await logAdminAction({
    admin_username: user!.username,
    action: "CREATE_TEAM",
    target_type: "team",
    target_id: newTeam.id,
    details: { username, team_name },
    ip_address: req.headers.get("x-forwarded-for") || null,
  });

  return NextResponse.json({ team: newTeam }, { status: 201 });
}
