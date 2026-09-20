import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getViolations } from "@/lib/store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "200");
  const violations = await getViolations(limit);
  return NextResponse.json({ violations });
}
