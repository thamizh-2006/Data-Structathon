import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTeamById, recordViolation } from "@/lib/store";
import { ViolationSeverity, ViolationType } from "@/lib/types";

// Severity rules — admin can override these via DB config in production
const SEVERITY_MAP: Record<ViolationType, ViolationSeverity> = {
  FULLSCREEN_EXIT: "HIGH",
  TAB_SWITCH: "HIGH",
  WINDOW_BLUR: "MEDIUM",
  COPY_PASTE: "MEDIUM",
  BLOCKED_SHORTCUT: "LOW",
  DEVTOOLS_ATTEMPT: "HIGH",
};

// Rate limiting: max 1 snapshot per team per 30s to avoid bandwidth exhaustion
const snapshotRateLimiter = new Map<string, number>();

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "team") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await req.json();
  const { violation_type, round_id, metadata, snapshot_data_url } = body;

  if (!violation_type || !round_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const vType = violation_type as ViolationType;
  const severity = SEVERITY_MAP[vType] || "MEDIUM";

  // Handle screenshot upload (rate-limited, server-validated)
  let snapshot_url: string | undefined;
  if (snapshot_data_url && severity !== "LOW") {
    const key = `${user.teamId}`;
    const lastUpload = snapshotRateLimiter.get(key) || 0;
    const now = Date.now();
    if (now - lastUpload > 30_000) {
      snapshotRateLimiter.set(key, now);
      // In production: upload to Supabase Storage, return URL
      // For now, store as data URL (first 512 chars for safety)
      snapshot_url = snapshot_data_url?.substring(0, 512) + "...[truncated]";
    }
  }

  const violation = await recordViolation({
    team_id: user.teamId,
    round_id: Number(round_id),
    violation_type: vType,
    severity,
    snapshot_url,
    metadata: {
      ...(metadata || {}),
      team_name: team.team_name,
      timestamp: new Date().toISOString(),
    },
  });

  // Broadcast to admin proctoring monitor
  const { eventBus } = await import("@/lib/realtime");
  eventBus.emit("violations", {
    type: "VIOLATION",
    violation: {
      ...violation,
      team_name: team.team_name,
    },
  });

  return NextResponse.json({ ok: true, violationId: violation.id, severity });
}
