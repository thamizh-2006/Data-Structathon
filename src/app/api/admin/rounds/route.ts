import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRounds, toggleRoundLock, updateRoundDuration, logAdminAction } from "@/lib/store";
import { eventBus } from "@/lib/realtime";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rounds = await getRounds();
  return NextResponse.json({ rounds });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { roundId, isUnlocked, duration_minutes } = body;

  if (roundId !== 1 && roundId !== 2) {
    return NextResponse.json({ error: "Invalid round ID" }, { status: 400 });
  }

  // Handle duration update
  if (duration_minutes !== undefined) {
    const mins = Number(duration_minutes);
    if (!Number.isInteger(mins) || mins < 1 || mins > 360) {
      return NextResponse.json({ error: "Duration must be between 1 and 360 minutes." }, { status: 400 });
    }
    const updated = await updateRoundDuration(roundId, mins);
    if (!updated) return NextResponse.json({ error: "Round not found" }, { status: 404 });

    const ip = req.headers.get("x-forwarded-for") || null;
    await logAdminAction({
      admin_username: user.username,
      action: "UPDATE_ROUND_DURATION",
      target_type: "round",
      target_id: String(roundId),
      details: { roundId, duration_minutes: mins },
      ip_address: ip,
    });

    return NextResponse.json({ round: updated });
  }

  const updated = await toggleRoundLock(roundId, Boolean(isUnlocked));
  if (!updated) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  // Broadcast to ALL connected clients via Realtime
  eventBus.emit("rounds", {
    type: "ROUND_STATE_CHANGED",
    roundId,
    isUnlocked: updated.is_unlocked,
    startedAt: updated.started_at,
    timestamp: new Date().toISOString(),
  });

  const ip = req.headers.get("x-forwarded-for") || null;
  await logAdminAction({
    admin_username: user.username,
    action: isUnlocked ? "UNLOCK_ROUND" : "LOCK_ROUND",
    target_type: "round",
    target_id: String(roundId),
    details: { roundId, is_unlocked: isUnlocked },
    ip_address: ip,
  });

  return NextResponse.json({ round: updated });
}
