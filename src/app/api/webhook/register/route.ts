import { NextRequest, NextResponse } from "next/server";
import { createTeam } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

// Secret token to verify the webhook request is authentic
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "datastructathon-webhook-secret-2026";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const {
      team_name,
      college_name,
      leader_name,
      leader_email,
      leader_phone,
      member2_name,
      member3_name,
      member4_name,
    } = data;

    if (!team_name || !college_name || !leader_name || !leader_email || !leader_phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a default username (e.g., team_name stripped of spaces)
    const rawUsername = `team_${team_name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    // Add some random suffix to prevent collisions
    const username = `${rawUsername}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Default password for all registered teams
    const defaultPassword = "Structathon@2026";
    const password_hash = await hashPassword(defaultPassword);

    const team = await createTeam({
      username,
      password_hash,
      team_name,
      college_name,
      leader_name,
      leader_email,
      leader_phone,
      member2_name: member2_name || null,
      member3_name: member3_name || null,
      member4_name: member4_name || null,
      is_shortlisted: false,
      is_disqualified: false,
      mail_status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Team registered successfully",
      team_id: team.id,
      username,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
