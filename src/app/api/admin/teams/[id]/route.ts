import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeamById,
  updateTeam,
  resetTeamPassword,
  disqualifyTeam,
  setTeamShortlisted,
  logAdminAction,
  terminateAllTeamSessions,
} from "@/lib/store";
import { eventBus } from "@/lib/realtime";
import crypto from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const team = await getTeamById(id);
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = team as any;
  return NextResponse.json({ team: safe });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json();
  const { action, ...updates } = body;

  const ip = req.headers.get("x-forwarded-for") || null;

  // --- Special actions ---
  if (action === "reset_password") {
    // Generate a cryptographically secure random password
    const newPassword = crypto.randomBytes(8).toString("base64url").substring(0, 12) + "@2026";
    await resetTeamPassword(id, newPassword);

    await logAdminAction({
      admin_username: user.username,
      action: "RESET_PASSWORD",
      target_type: "team",
      target_id: id,
      details: { note: "Password reset by admin. New credentials emailed." },
      ip_address: ip,
    });

    // Send credentials email (fire-and-forget)
    const team = await getTeamById(id);
    if (team) {
      sendCredentialsEmail(team.leader_email, team.team_name, team.username, newPassword).catch(
        (e) => console.error("Email failed:", e)
      );
    }
    return NextResponse.json({
      success: true,
      message: "Password reset and credentials email dispatched.",
    });
  }

  if (action === "disqualify") {
    const { reason } = body;
    const team = await getTeamById(id);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    await disqualifyTeam(id, reason || "Disqualified by admin.");
    await terminateAllTeamSessions(id);

    // Realtime kick
    eventBus.emit(`team-session:${id}`, {
      type: "DISQUALIFIED",
      teamId: id,
      reason: reason || "Your team has been disqualified from the event.",
      timestamp: new Date().toISOString(),
    });

    await logAdminAction({
      admin_username: user.username,
      action: "DISQUALIFY_TEAM",
      target_type: "team",
      target_id: id,
      details: { team_name: team.team_name, reason },
      ip_address: ip,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "shortlist") {
    const { value } = body;
    await setTeamShortlisted(id, Boolean(value));
    await logAdminAction({
      admin_username: user.username,
      action: value ? "SHORTLIST_TEAM" : "UNSHORTLIST_TEAM",
      target_type: "team",
      target_id: id,
      details: {},
      ip_address: ip,
    });
    return NextResponse.json({ success: true });
  }

  // --- Generic field update ---
  const allowed = [
    "team_name", "college_name", "leader_name", "leader_email", "leader_phone",
    "member2_name", "member3_name", "member4_name",
  ];
  const filtered: Record<string, string> = {};
  allowed.forEach((k) => { if (updates[k] !== undefined) filtered[k] = updates[k]; });

  const updated = await updateTeam(id, filtered);
  if (!updated) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  await logAdminAction({
    admin_username: user.username,
    action: "EDIT_TEAM",
    target_type: "team",
    target_id: id,
    details: { fields_updated: Object.keys(filtered) },
    ip_address: ip,
  });

  return NextResponse.json({ team: updated });
}

async function sendCredentialsEmail(
  email: string,
  teamName: string,
  username: string,
  password: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "noreply@datastructathon.com";
  if (!resendKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Data Structathon 2026 — Your Login Credentials",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Data Structathon 2026</h2>
          <p>Hi <strong>${teamName}</strong>,</p>
          <p>Your account credentials have been reset by an administrator. Please use the details below to log in:</p>
          <div style="background: #f1f3f9; border-radius: 8px; padding: 16px 20px; margin: 16px 0; border-left: 4px solid #4f46e5;">
            <p style="margin: 4px 0;"><strong>Username:</strong> <code style="background: #e8eaf6; padding: 2px 6px; border-radius: 4px;">${username}</code></p>
            <p style="margin: 4px 0;"><strong>Password:</strong> <code style="background: #e8eaf6; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          </div>
          <p>Login URL: <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a></p>
          <p style="font-size: 12px; color: #94a3b8;">Do not share these credentials. Each team must use a single active session.</p>
        </div>
      `,
    }),
  });
}
