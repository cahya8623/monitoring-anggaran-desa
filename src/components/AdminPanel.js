"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, FilePlus2, Landmark, LogOut, Pencil, Plus, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { transactionCategories } from "@/lib/demo-data";

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const emptyForm = () => ({ date: new Date().toISOString().slice(0, 10), type: "expense", category: "Pembangunan", activity: "", amount: "", note: "" });
const shortMoney = (value) => value >= 1_000_000_000 ? `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M` : `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
const formatDate = (value) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export default function AdminPanel({ username }) {
  const router = useRouter();
  const [year, setYear] = useState(2025);
  const [summary, setSummary] = useState(null);
  const [years, setYears] = useState([]);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    const response = await fetch(`/api/summary?year=${year}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) { setSummary(data); setYears(data.years); }
  }, [year]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year), page: String(page), pageSize: "8", q: search });
      const response = await fetch(`/api/transactions?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Daftar transaksi gagal dimuat.");
      setRows(data.rows); setPages(data.pages);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [year, page, search]);

  useEffect(() => {
    // Fetches are async; state updates happen after the response resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary().catch((err) => setError(err.message));
  }, [loadSummary]);
  useEffect(() => {
    // Fetches are async; state updates happen after the response resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRows();
  }, [loadRows]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const clearForm = () => { setForm(emptyForm()); setEditingId(null); setNotice(""); setError(""); };

  const saveTransaction = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const payload = { ...form, year: Number(form.date.slice(0, 4)), amount: Number(form.amount) };
    try {
      const response = await fetch(editingId ? `/api/transactions/${editingId}` : "/api/transactions", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transaksi tidak berhasil disimpan.");
      setNotice(editingId ? "Perubahan transaksi tersimpan." : "Transaksi berhasil ditambahkan.");
      setForm(emptyForm()); setEditingId(null); setYear(payload.year); setPage(1);
      await Promise.all([loadSummary(), loadRows()]);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const editTransaction = (row) => {
    setEditingId(row.id);
    setForm({ date: row.date, type: row.type, category: row.category, activity: row.activity, amount: String(row.amount), note: row.note || "" });
    setNotice(""); setError("");
    document.getElementById("form-transaksi")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteTransaction = async (row) => {
    if (!window.confirm(`Hapus transaksi “${row.activity}”? Tindakan ini tidak bisa dibatalkan.`)) return;
    setError(""); setNotice("");
    try {
      const response = await fetch(`/api/transactions/${row.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transaksi gagal dihapus.");
      setNotice("Transaksi berhasil dihapus.");
      await Promise.all([loadSummary(), loadRows()]);
    } catch (err) { setError(err.message); }
  };

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); };

  return <main className="min-h-screen pb-12">
    <header className="border-b border-[#e6ebe5] bg-white"><div className="shell flex h-[70px] items-center justify-between">
      <Link href="/" className="flex items-center gap-3"><span className="brand-mark"><Landmark size={19} /></span><span><b className="block text-sm">Ruang Anggaran</b><small className="text-[10px] uppercase tracking-[.12em] text-[#849087]">Panel admin</small></span></Link>
      <div className="flex items-center gap-3"><span className="hidden text-xs text-[#79877e] sm:inline">Masuk sebagai <b className="text-[#294638]">{username}</b></span><button onClick={logout} className="button-quiet !px-3 !py-2 text-xs"><LogOut size={14} /> Keluar</button></div>
    </div></header>

    <div className="shell pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Link href="/" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#718078] hover:text-[#21684c]"><ArrowLeft size={13} /> Lihat dashboard publik</Link><h1 className="text-3xl font-extrabold tracking-[-.045em]">Panel pengelola</h1><p className="mt-2 text-sm text-[#77857c]">Kelola catatan transaksi agar informasi publik tetap mutakhir.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d5e8d8] bg-[#f0f8f1] px-3 py-2 text-[11px] font-bold text-[#39704e]"><ShieldCheck size={14} /> Sesi admin aktif</span>
      </div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-5 rounded-xl border border-[#cce4d1] bg-[#eff8f0] px-4 py-3 text-sm text-[#286b42]">{notice}</div>}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: "Pemasukan", value: shortMoney(summary?.income || 0), icon: ArrowDownLeft, color: "#32704a", bg: "#e9f4ec" }, { label: "Pengeluaran", value: shortMoney(summary?.expense || 0), icon: ArrowUpRight, color: "#a35c30", bg: "#fff0e7" }, { label: "Saldo tersisa", value: shortMoney(summary?.balance || 0), icon: Landmark, color: "#5869a5", bg: "#edf0fa" }, { label: "Realisasi", value: `${summary?.realization || 0}%`, icon: FilePlus2, color: "#a57b20", bg: "#f8f1dc" }].map(({ label, value, icon: Icon, color, bg }) => <article className="card p-4" key={label}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#77857c]">{label}</span><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ color, background: bg }}><Icon size={15} /></span></div><p className="mt-3 text-xl font-extrabold tracking-[-.04em]">{value}</p></article>)}
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[.88fr_1.12fr]">
        <section id="form-transaksi" className="card p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e9f3eb] text-[#34704c]"><Plus size={16} /></span><h2 className="text-base font-extrabold">{editingId ? "Ubah transaksi" : "Tambah transaksi"}</h2></div><p className="mt-2 text-xs text-[#839087]">Lengkapi informasi pemasukan atau belanja.</p></div>{editingId && <button onClick={clearForm} className="button-quiet !px-2.5 !py-2 text-xs"><X size={14} /> Batal</button>}</div>
          <form onSubmit={saveTransaction} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3"><label><span className="form-label">Tanggal</span><input className="input-control text-xs" type="date" required value={form.date} onChange={(event) => updateForm("date", event.target.value)} /></label><label><span className="form-label">Jenis transaksi</span><select className="input-control text-xs" value={form.type} onChange={(event) => updateForm("type", event.target.value)}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label></div>
            <label className="block"><span className="form-label">Kategori / sumber dana</span><select className="input-control text-xs" value={form.category} onChange={(event) => updateForm("category", event.target.value)}>{transactionCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="block"><span className="form-label">Uraian kegiatan</span><input className="input-control text-xs" required minLength={3} maxLength={180} value={form.activity} onChange={(event) => updateForm("activity", event.target.value)} placeholder="Contoh: Perbaikan jalan lingkungan" /></label>
            <label className="block"><span className="form-label">Nominal (rupiah)</span><input className="input-control text-xs" type="number" min="1" step="1" required value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder="Contoh: 25000000" /></label>
            <label className="block"><span className="form-label">Catatan (opsional)</span><textarea className="input-control min-h-20 resize-y text-xs" maxLength={1000} value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="Keterangan tambahan atau referensi bukti" /></label>
            <button type="submit" disabled={busy} className="button-primary w-full !py-3 text-xs disabled:opacity-60">{busy ? "Menyimpan…" : editingId ? <><Save size={15} /> Simpan perubahan</> : <><Plus size={15} /> Tambahkan transaksi</>}</button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-col justify-between gap-3 p-5 md:flex-row md:items-end md:px-6 md:pt-6">
            <div><h2 className="text-base font-extrabold">Daftar transaksi</h2><p className="mt-1 text-xs text-[#839087]">Edit atau hapus catatan transaksi.</p></div>
            <div className="grid grid-cols-2 gap-2"><label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9a90]" /><input className="input-control !py-2.5 !pl-9 text-xs" placeholder="Cari uraian…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><select aria-label="Filter tahun" className="input-control !py-2.5 text-xs" value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1); }}>{(years.length ? years : [year]).map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-left"><thead><tr className="bg-[#f8faf7]"><th className="table-head px-5 py-3">Tanggal</th><th className="table-head px-3 py-3">Uraian</th><th className="table-head px-3 py-3">Jenis</th><th className="table-head px-3 py-3 text-right">Nominal</th><th className="table-head px-5 py-3 text-right">Aksi</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5" className="px-5 py-10 text-center text-xs text-[#7c8981]">Memuat data…</td></tr> : rows.length ? rows.map((row) => <tr className="table-row" key={row.id}><td className="whitespace-nowrap px-5 py-3.5 text-[11px] text-[#718078]">{formatDate(row.date)}</td><td className="px-3 py-3.5"><p className="max-w-[190px] truncate text-xs font-bold">{row.activity}</p><p className="mt-1 text-[10px] text-[#8c9990]">{row.category}</p></td><td className="px-3 py-3.5"><span className={`badge ${row.type === "income" ? "bg-[#e9f4ec] text-[#32704a]" : "bg-[#fff0e7] text-[#a35c30]"}`}>{row.type === "income" ? "Masuk" : "Keluar"}</span></td><td className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold">{money.format(row.amount)}</td><td className="whitespace-nowrap px-5 py-3.5 text-right"><button title="Edit" aria-label={`Edit ${row.activity}`} onClick={() => editTransaction(row)} className="mr-1 inline-grid h-8 w-8 place-items-center rounded-lg text-[#58735f] hover:bg-[#edf4ee]"><Pencil size={14} /></button><button title="Hapus" aria-label={`Hapus ${row.activity}`} onClick={() => deleteTransaction(row)} className="inline-grid h-8 w-8 place-items-center rounded-lg text-[#a6654d] hover:bg-[#fff0e7]"><Trash2 size={14} /></button></td></tr>) : <tr><td colSpan="5" className="px-5 py-12 text-center text-xs text-[#839087]">Belum ada transaksi pada filter ini.</td></tr>}
          </tbody></table></div>
          <div className="flex items-center justify-between border-t border-[#edf1ed] px-5 py-3.5"><span className="text-[10px] text-[#7b8980]">Halaman {page} / {pages}</span><div className="flex gap-2"><button className="button-quiet !px-3 !py-2 text-[10px] disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Sebelumnya</button><button className="button-quiet !px-3 !py-2 text-[10px] disabled:opacity-40" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>Berikutnya</button></div></div>
        </section>
      </div>
      <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#e8eadf] bg-[#fbf9f1] p-4 text-[11px] leading-5 text-[#7a704f]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /> Semua data awal adalah simulasi. Pastikan mengganti data contoh dengan catatan resmi yang telah diverifikasi sebelum aplikasi dipakai untuk publik.</p>
    </div>
  </main>;
}
