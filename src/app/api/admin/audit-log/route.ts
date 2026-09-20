import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const logs = await getAuditLogs(200);
  return NextResponse.json({ logs });
}
