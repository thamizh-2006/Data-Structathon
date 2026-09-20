import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/store";

export async function GET() {
  const leaderboard = await getLeaderboard();
  return NextResponse.json({ leaderboard });
}
