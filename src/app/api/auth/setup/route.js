import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({
  setupToken: z.string().min(1),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
});

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const configuredToken = process.env.SETUP_TOKEN;
  if (!configuredToken || configuredToken.length < 24) {
    return NextResponse.json({ error: "SETUP_TOKEN belum dikonfigurasi dengan aman." }, { status: 503 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Periksa username, email, dan password (minimal 12 karakter)." }, { status: 400 });
  if (!safeEqual(parsed.data.setupToken, configuredToken)) return NextResponse.json({ error: "Token setup tidak cocok." }, { status: 403 });

  const db = getDb();
  if (db.prepare("SELECT id FROM admins LIMIT 1").get()) return NextResponse.json({ error: "Admin sudah dibuat. Setup awal sudah ditutup." }, { status: 409 });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const create = db.transaction(() => {
      if (db.prepare("SELECT id FROM admins LIMIT 1").get()) throw new Error("ADMIN_EXISTS");
      return db.prepare("INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)")
        .run(parsed.data.username, parsed.data.email, passwordHash);
    });
    create();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error.message === "ADMIN_EXISTS") return NextResponse.json({ error: "Admin sudah dibuat." }, { status: 409 });
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return NextResponse.json({ error: "Username atau email sudah digunakan." }, { status: 409 });
    throw error;
  }
}
