import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const count = getDb().prepare("SELECT COUNT(*) AS count FROM admins").get().count;
  return NextResponse.json({ hasAdmin: count > 0 });
}
