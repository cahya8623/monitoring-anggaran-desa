import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export async function GET(request) {
  const requested = new URL(request.url).searchParams.get("year");
  const db = getDb();
  const years = db.prepare("SELECT DISTINCT year FROM transactions ORDER BY year DESC").all().map((row) => row.year);
  const year = requested && /^\d{4}$/.test(requested) ? Number(requested) : (years[0] || new Date().getFullYear());
  const totals = db.prepare("SELECT type, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE year = ? GROUP BY type").all(year);
  const income = totals.find((row) => row.type === "income")?.total || 0;
  const expense = totals.find((row) => row.type === "expense")?.total || 0;
  const categoryRows = db.prepare(`SELECT category, SUM(amount) AS total FROM transactions
    WHERE year = ? AND type = 'expense' GROUP BY category ORDER BY total DESC`).all(year);
  const monthlyRows = db.prepare(`SELECT CAST(substr(date, 6, 2) AS INTEGER) AS month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions WHERE year = ? GROUP BY month ORDER BY month`).all(year);
  const monthlyMap = new Map(monthlyRows.map((row) => [row.month, row]));
  const monthly = monthLabels.map((label, index) => {
    const row = monthlyMap.get(index + 1);
    return { month: label, income: row?.income || 0, expense: row?.expense || 0 };
  });
  return NextResponse.json({
    year,
    years,
    income,
    expense,
    balance: income - expense,
    realization: income > 0 ? Math.round((expense / income) * 1000) / 10 : 0,
    categories: categoryRows,
    monthly,
  });
}
