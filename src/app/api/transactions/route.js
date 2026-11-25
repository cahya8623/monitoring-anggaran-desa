import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  year: z.coerce.number().int().min(2000).max(2100),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(80),
  activity: z.string().trim().min(3).max(180),
  amount: z.coerce.number().int().positive().max(999999999999),
  note: z.string().trim().max(1000).optional().default(""),
}).refine((data) => Number(data.date.slice(0, 4)) === data.year, { message: "Tahun harus sesuai dengan tanggal." });

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const where = [];
  const values = [];
  const year = params.get("year");
  const type = params.get("type");
  const category = params.get("category");
  const query = params.get("q")?.trim();
  if (year && /^\d{4}$/.test(year)) { where.push("year = ?"); values.push(Number(year)); }
  if (["income", "expense"].includes(type)) { where.push("type = ?"); values.push(type); }
  if (category && category !== "all") { where.push("category = ?"); values.push(category); }
  if (query) { where.push("(activity LIKE ? OR category LIKE ? OR note LIKE ?)"); values.push(`%${query}%`, `%${query}%`, `%${query}%`); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get("pageSize") || "10", 10) || 10));
  const orderBy = params.get("sort") === "amount" ? "amount" : "date";
  const direction = params.get("direction") === "asc" ? "ASC" : "DESC";
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS count FROM transactions ${clause}`).get(...values).count;
  const rows = db.prepare(`SELECT id, date, year, type, category, activity, amount, note
    FROM transactions ${clause} ORDER BY ${orderBy} ${direction}, id DESC LIMIT ? OFFSET ?`)
    .all(...values, pageSize, (page - 1) * pageSize);
  return NextResponse.json({ rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Kamu harus login sebagai admin." }, { status: 401 });
  const parsed = transactionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data transaksi tidak valid." }, { status: 400 });
  const data = parsed.data;
  const result = getDb().prepare(`INSERT INTO transactions (date, year, type, category, activity, amount, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(data.date, data.year, data.type, data.category, data.activity, data.amount, data.note);
  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}
