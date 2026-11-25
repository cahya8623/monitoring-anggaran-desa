import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ token: z.string().min(20).max(200), password: z.string().min(12).max(128) });
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function POST(request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Token tidak valid atau password kurang dari 12 karakter." }, { status: 400 });
  const db = getDb();
  const reset = db.prepare(`SELECT id, admin_id FROM password_resets
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`).get(hashToken(parsed.data.token), new Date().toISOString());
  if (!reset) return NextResponse.json({ error: "Tautan reset tidak valid atau sudah kedaluwarsa." }, { status: 400 });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const update = db.transaction(() => {
    const current = db.prepare("SELECT id FROM password_resets WHERE id = ? AND used_at IS NULL AND expires_at > ?")
      .get(reset.id, new Date().toISOString());
    if (!current) return false;
    db.prepare("UPDATE admins SET password_hash = ?, session_version = session_version + 1 WHERE id = ?").run(passwordHash, reset.admin_id);
    db.prepare("DELETE FROM password_resets WHERE admin_id = ?").run(reset.admin_id);
    return true;
  });
  if (!update()) return NextResponse.json({ error: "Tautan reset sudah digunakan atau kedaluwarsa." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
