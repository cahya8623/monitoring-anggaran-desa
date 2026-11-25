import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hasSmtpConfig, sendResetEmail } from "@/lib/mailer";

export const runtime = "nodejs";
const schema = z.object({ email: z.email().trim().toLowerCase() });
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function POST(request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Masukkan alamat email yang valid." }, { status: 400 });
  if (!hasSmtpConfig()) return NextResponse.json({ error: "Email reset belum aktif. Lengkapi pengaturan SMTP di .env.local." }, { status: 503 });

  const admin = getDb().prepare("SELECT id, email FROM admins WHERE email = ? COLLATE NOCASE").get(parsed.data.email);
  if (admin) {
    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const db = getDb();
    db.prepare("DELETE FROM password_resets WHERE admin_id = ? OR expires_at < ?").run(admin.id, new Date().toISOString());
    db.prepare("INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES (?, ?, ?)").run(admin.id, hashToken(rawToken), expiresAt);
    const url = new URL("/reset-password", process.env.APP_URL || new URL(request.url).origin);
    url.searchParams.set("token", rawToken);
    try {
      await sendResetEmail({ to: admin.email, resetUrl: url.toString() });
    } catch (error) {
      db.prepare("DELETE FROM password_resets WHERE token_hash = ?").run(hashToken(rawToken));
      console.error("Gagal mengirim email reset:", error.message);
      return NextResponse.json({ error: "Email reset gagal dikirim. Periksa konfigurasi SMTP." }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true, message: "Jika email terdaftar, tautan reset akan dikirim." });
}
