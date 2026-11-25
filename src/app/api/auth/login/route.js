import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";
const schema = z.object({ username: z.string().trim().min(1).max(40), password: z.string().min(1).max(128) });

export async function POST(request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Username atau password tidak valid." }, { status: 400 });
  const admin = getDb().prepare("SELECT id, username, email, password_hash, session_version FROM admins WHERE username = ? COLLATE NOCASE")
    .get(parsed.data.username);
  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.password_hash))) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }
  await createSession(admin);
  return NextResponse.json({ ok: true, username: admin.username });
}
