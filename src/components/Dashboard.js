"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, CalendarDays, CircleHelp, Clock3, Coins, Landmark, MapPin, Search, ShieldCheck, Wallet } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { villageProfile, transactionCategories } from "@/lib/demo-data";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const compact = (value) => {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return rupiah.format(value || 0);
};
const dateText = (value) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
const palette = ["#286b4d", "#7bad83", "#e0b95e", "#99b8aa", "#d28a67", "#4d7880", "#b4a27a"];

function Brand() {
  return <Link href="/" className="flex items-center gap-3" aria-label="Ruang Anggaran Desa, beranda">
    <span className="brand-mark"><Landmark size={20} strokeWidth={2.2} /></span>
    <span><span className="brand-name block">Ruang Anggaran</span><span className="brand-sub block">Transparansi Desa</span></span>
  </Link>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-[#e7ece6] bg-white px-3 py-2.5 shadow-lg">
    <p className="mb-1 text-xs font-bold text-[#17372d]">{label}</p>
    {payload.map((item) => <p key={item.dataKey} className="text-xs" style={{ color: item.color }}>{item.name}: {compact(item.value)}</p>)}
  </div>;
}

export default function Dashboard() {
  const [year, setYear] = useState(2025);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/summary?year=${year}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Ringkasan belum bisa dimuat.");
      const data = await response.json();
      setSummary(data);
      if (data.year !== year) setYear(data.year);
    } catch (err) { setError(err.message); }
  }, [year]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year), page: String(page), pageSize: "8", sort, direction: "desc" });
      if (type !== "all") params.set("type", type);
      if (category !== "all") params.set("category", category);
      if (search.trim()) params.set("q", search.trim());
      const response = await fetch(`/api/transactions?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Riwayat transaksi belum bisa dimuat.");
      const data = await response.json();
      setRows(data.rows);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [year, page, type, category, search, sort]);

  useEffect(() => {
    // Fetches are async; state updates happen after the response resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    // Fetches are async; state updates happen after the response resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRows();
  }, [loadRows]);

  const categoryData = useMemo(() => summary?.categories || [], [summary]);
  const cards = [
    { title: "Total pemasukan", value: compact(summary?.income), detail: "Dana tersedia tahun ini", icon: Coins, tint: "#e7f2e9", color: "#236348" },
    { title: "Total pengeluaran", value: compact(summary?.expense), detail: "Akumulasi belanja desa", icon: ArrowUpRight, tint: "#fff2e8", color: "#bb6b39" },
    { title: "Sisa anggaran", value: compact(summary?.balance), detail: "Pemasukan dikurangi belanja", icon: Wallet, tint: "#edf0fa", color: "#5869a5" },
    { title: "Realisasi anggaran", value: `${summary?.realization ?? 0}%`, detail: "Dari total pemasukan", icon: Activity, tint: "#f8f1dc", color: "#a57b20" },
  ];

  return <main>
    <header className="shell site-header">
      <Brand />
      <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
        <a className="nav-link" href="#ringkasan">Ringkasan</a>
        <a className="nav-link" href="#transaksi">Transaksi</a>
        <a className="nav-link" href="#profil">Profil desa</a>
      </nav>
      <Link href="/login" className="button-quiet !px-3 !py-2 text-xs"><ShieldCheck size={15} /> Admin</Link>
    </header>

    <section className="shell pt-7 md:pt-10">
      <div className="relative overflow-hidden rounded-[22px] bg-[#173f31] px-6 py-7 text-white md:px-10 md:py-9">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 top-3 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#d8e8da]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9bc997]" /> Data contoh · Transparansi warga
            </div>
            <h1 className="text-3xl font-bold tracking-[-.045em] md:text-[40px]">Anggaran desa, <span className="text-[#d8c27f]">terbuka untuk semua.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Pantau bagaimana dana desa direncanakan dan digunakan. Informasi yang jelas membantu kita tumbuh bersama.</p>
          </div>
          <label className="flex shrink-0 flex-col gap-2 text-xs font-semibold text-white/65">
            Tahun anggaran
            <span className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={15} />
              <select value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1); }} className="min-w-40 appearance-none rounded-xl border border-white/15 bg-white/10 py-3 pl-10 pr-10 text-sm font-bold text-white outline-none focus:border-white/40">
                {(summary?.years?.length ? summary.years : [2025, 2024, 2023]).map((item) => <option key={item} className="text-[#17372d]" value={item}>{item}</option>)}
              </select>
            </span>
          </label>
        </div>
      </div>

      <div id="ringkasan" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon, tint, color }) => <article className="card kpi-card" key={title}>
          <div className="flex items-center justify-between"><p className="small-label">{title}</p><span className="kpi-icon" style={{ background: tint, color }}><Icon size={17} /></span></div>
          <p className="mt-4 text-[19px] font-extrabold tracking-[-.04em] text-[#17372d] sm:text-[22px]">{value || "—"}</p>
          <p className="mt-1 text-[10px] text-[#8a978e] sm:text-[11px]">{detail}</p>
        </article>)}
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} Coba muat ulang halaman.</div>}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="card p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="section-title">Arus anggaran</h2><p className="section-caption mt-1">Pemasukan dan pengeluaran bulanan · {year}</p></div>
            <span className="rounded-lg bg-[#f0f5f0] px-2.5 py-1.5 text-[10px] font-bold text-[#4c6e58]">Per bulan</span>
          </div>
          <div className="mt-5 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.monthly || []} margin={{ top: 8, right: 6, bottom: 0, left: -16 }}>
                <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c9567" stopOpacity={0.22} /><stop offset="95%" stopColor="#4c9567" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e3ad62" stopOpacity={0.2} /><stop offset="95%" stopColor="#e3ad62" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#edf1ed" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#87948a", fontSize: 10 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#87948a", fontSize: 9 }} tickFormatter={(v) => `${Math.round(v / 1_000_000)} jt`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: "#66766c", paddingTop: 8 }} />
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#43865d" strokeWidth={2.5} fill="url(#incomeFill)" activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#d79a4f" strokeWidth={2.5} fill="url(#expenseFill)" activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 md:p-6">
          <div><h2 className="section-title">Belanja per bidang</h2><p className="section-caption mt-1">Pengeluaran menurut kategori · {year}</p></div>
          {categoryData.length ? <div className="mt-3 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 6 }}>
                <CartesianGrid stroke="#edf1ed" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" width={114} axisLine={false} tickLine={false} tick={{ fill: "#66766c", fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f4f7f3" }} />
                <Bar dataKey="total" name="Belanja" radius={[0, 6, 6, 0]} barSize={18}>
                  {categoryData.map((entry, index) => <Cell key={entry.category} fill={palette[index % palette.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div> : <div className="grid h-[260px] place-items-center text-sm text-[#839087]">Belum ada data pengeluaran.</div>}
        </section>
      </div>

      <section id="transaksi" className="card mt-5 overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-end md:px-6 md:pt-6">
          <div><div className="flex items-center gap-2"><h2 className="section-title">Riwayat transaksi</h2><span className="rounded-full bg-[#edf4ee] px-2 py-1 text-[10px] font-bold text-[#427052]">{total} catatan</span></div><p className="section-caption mt-1">Catatan pemasukan dan penggunaan anggaran desa</p></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(180px,1fr)_145px_160px]">
            <label className="relative col-span-2 sm:col-span-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9a90]" size={15} /><input aria-label="Cari transaksi" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari transaksi..." className="input-control !py-2.5 !pl-9 text-xs" /></label>
            <select aria-label="Filter jenis transaksi" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="input-control !py-2.5 text-xs"><option value="all">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select>
            <select aria-label="Filter kategori" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="input-control !py-2.5 text-xs"><option value="all">Semua kategori</option>{transactionCategories.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead><tr className="bg-[#f8faf7]"><th className="table-head px-6 py-3">Tanggal</th><th className="table-head px-4 py-3">Uraian</th><th className="table-head px-4 py-3">Kategori</th><th className="table-head px-4 py-3">Jenis</th><th className="table-head cursor-pointer px-6 py-3 text-right" onClick={() => { setSort(sort === "date" ? "amount" : "date"); setPage(1); }}>Nominal ↕</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-[#7c8981]">Memuat transaksi…</td></tr> : rows.length ? rows.map((row) => <tr className="table-row transition-colors hover:bg-[#fbfcfa]" key={row.id}>
                <td className="whitespace-nowrap px-6 py-4 text-xs text-[#718078]">{dateText(row.date)}</td>
                <td className="px-4 py-4"><p className="max-w-[270px] truncate text-xs font-bold text-[#253f33]">{row.activity}</p>{row.note && <p className="mt-1 max-w-[270px] truncate text-[10px] text-[#98a29b]">{row.note}</p>}</td>
                <td className="px-4 py-4 text-xs text-[#647369]">{row.category}</td>
                <td className="px-4 py-4"><span className={`badge ${row.type === "income" ? "bg-[#e9f4ec] text-[#32704a]" : "bg-[#fff0e7] text-[#a35c30]"}`}>{row.type === "income" ? "Pemasukan" : "Pengeluaran"}</span></td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-xs font-extrabold ${row.type === "income" ? "text-[#32704a]" : "text-[#a35c30]"}`}>{row.type === "income" ? "+ " : "− "}{rupiah.format(row.amount)}</td>
              </tr>) : <tr><td colSpan="5" className="px-6 py-12 text-center"><CircleHelp size={22} className="mx-auto mb-2 text-[#9aa69d]" /><p className="text-sm font-semibold text-[#52645a]">Tidak ada transaksi yang cocok</p><p className="mt-1 text-xs text-[#8c9990]">Coba ubah filter atau kata kunci pencarian.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf1ed] px-5 py-3.5 md:px-6">
          <span className="text-[11px] text-[#7b8980]">Halaman {page} dari {pages}</span>
          <div className="flex gap-2"><button className="button-quiet !px-3 !py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Sebelumnya</button><button className="button-quiet !px-3 !py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>Berikutnya <ArrowRight size={13} /></button></div>
        </div>
      </section>

      <section id="profil" className="mt-12 pb-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#678b70]">Kenali lebih dekat</p><h2 className="text-2xl font-extrabold tracking-[-.04em]">Tentang {villageProfile.name}</h2></div><span className="hidden items-center gap-1.5 rounded-full bg-[#fff4dc] px-3 py-1.5 text-[10px] font-bold text-[#916c20] sm:inline-flex"><CircleHelp size={13} /> Profil demo</span></div>
        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <article className="card p-6 md:p-7">
            <div className="flex items-center gap-2 text-xs font-bold text-[#467152]"><MapPin size={15} /> {villageProfile.location}</div>
            <p className="mt-4 text-sm leading-7 text-[#52645a]">{villageProfile.vision}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[{ value: villageProfile.population, label: "Jumlah penduduk" }, { value: villageProfile.area, label: "Luas wilayah" }, { value: villageProfile.hamlets, label: "Wilayah" }].map((item) => <div className="rounded-xl bg-[#f6f8f4] p-3" key={item.label}><p className="text-sm font-extrabold text-[#244d37]">{item.value}</p><p className="mt-1 text-[10px] text-[#839087]">{item.label}</p></div>)}
            </div>
            <div className="mt-5 border-t border-[#edf1ed] pt-4"><p className="text-xs font-bold">Arah pembangunan</p><ul className="mt-3 space-y-2">{villageProfile.missions.map((mission) => <li className="flex gap-2 text-xs leading-5 text-[#66766c]" key={mission}><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#72a47d]" />{mission}</li>)}</ul></div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#edf1ed] pt-4 text-[11px] text-[#75837a]"><span className="flex items-center gap-1.5"><MapPin size={13} /> {villageProfile.office}</span><span className="flex items-center gap-1.5"><Clock3 size={13} /> {villageProfile.officeHours}</span></div>
          </article>
          <article className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4"><div><h3 className="text-sm font-extrabold">Peta wilayah</h3><p className="mt-1 text-[10px] text-[#839087]">Lokasi ilustrasi untuk data demo</p></div><a href={`https://www.openstreetmap.org/?mlat=${villageProfile.coordinates.lat}&mlon=${villageProfile.coordinates.lon}#map=13/${villageProfile.coordinates.lat}/${villageProfile.coordinates.lon}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-[#39704e]">Buka peta <ArrowUpRight size={12} /></a></div>
            <iframe title="Peta ilustrasi lokasi Desa Sumber Makmur" className="h-[280px] w-full border-0 bg-[#edf2ec]" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=110.16%2C-7.30%2C110.25%2C-7.21&layer=mapnik&marker=${villageProfile.coordinates.lat}%2C${villageProfile.coordinates.lon}`} />
            <div className="flex items-center justify-between gap-3 border-t border-[#edf1ed] px-5 py-3 text-[10px] text-[#849087]"><span className="flex items-center gap-1.5"><MapPin size={12} /> {villageProfile.location}</span><span>© OpenStreetMap</span></div>
          </article>
        </div>
      </section>
    </section>

    <footer className="border-t border-[#e6ebe5] bg-white">
      <div className="shell flex flex-col justify-between gap-3 py-5 text-[10px] text-[#819087] sm:flex-row sm:items-center"><span>© {new Date().getFullYear()} Ruang Anggaran Desa · Contoh proyek portofolio.</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Data pada halaman ini adalah data simulasi.</span></div>
    </footer>
  </main>;
}
