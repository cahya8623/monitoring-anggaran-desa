import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  year: z.coerce.number().int().min(2000).max(2100),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(80),
  activity: z.string().trim().min(3).max(180),
  amount: z.coerce.number().int().positive().max(999999999999),
  note: z.string().trim().max(1000).optional().default(""),
}).refine((data) => Number(data.date.slice(0, 4)) === data.year, { message: "Tahun harus sesuai dengan tanggal." });

export async function PATCH(request, context) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Kamu harus login sebagai admin." }, { status: 401 });
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ID transaksi tidak valid." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data transaksi tidak valid." }, { status: 400 });
  const data = parsed.data;
  const result = getDb().prepare(`UPDATE transactions SET date = ?, year = ?, type = ?, category = ?, activity = ?, amount = ?, note = ? WHERE id = ?`)
    .run(data.date, data.year, data.type, data.category, data.activity, data.amount, data.note, id);
  if (!result.changes) return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, context) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Kamu harus login sebagai admin." }, { status: 401 });
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ID transaksi tidak valid." }, { status: 400 });
  const result = getDb().prepare("DELETE FROM transactions WHERE id = ?").run(id);
  if (!result.changes) return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
