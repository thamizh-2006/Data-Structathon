import { NextResponse } from "next/server";
import { getRounds } from "@/lib/store";

export async function GET() {
  const rounds = await getRounds();
  return NextResponse.json({ rounds });
}
