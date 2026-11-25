"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Landmark, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

function BrandCompact() {
  return <Link href="/" className="mb-10 inline-flex items-center gap-3"><span className="brand-mark"><Landmark size={19} /></span><span><b className="block text-sm">Ruang Anggaran</b><small className="text-[10px] uppercase tracking-[.12em] text-[#849087]">Transparansi Desa</small></span></Link>;
}

function AuthLayout({ title, subtitle, children }) {
  return <main className="auth-wrap">
    <aside className="auth-aside">
      <div><BrandCompact /><span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/75"><ShieldCheck size={13} /> Akses pengelola</span></div>
      <div className="max-w-lg pb-10"><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d7c27c]">Data desa, dijaga bersama</p><h1 className="text-4xl font-extrabold leading-tight tracking-[-.05em]">Kelola transparansi dengan aman.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/70">Panel admin digunakan untuk memperbarui catatan anggaran. Setiap perubahan akan langsung tampil di dashboard publik.</p></div>
      <p className="text-xs text-white/45">Ruang Anggaran Desa · Proyek portofolio</p>
    </aside>
    <section className="auth-panel">
      <div className="mb-8 md:hidden"><BrandCompact /></div>
      <Link href="/" className="mb-7 inline-flex items-center gap-1.5 text-xs font-semibold text-[#77857c] hover:text-[#21684c]"><ArrowLeft size={14} /> Kembali ke dashboard</Link>
      <h2 className="text-2xl font-extrabold tracking-[-.04em]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#7a8980]">{subtitle}</p>
      <div className="mt-7">{children}</div>
      <p className="mt-9 border-t border-[#edf1ed] pt-5 text-[10px] leading-5 text-[#96a098]">Gunakan halaman ini hanya melalui perangkat yang kamu percaya. Kata sandi disimpan dalam bentuk hash di database.</p>
    </section>
  </main>;
}

function Notice({ error, success }) {
  if (!error && !success) return null;
  return <div role="status" className={`mb-4 rounded-xl px-3.5 py-3 text-xs leading-5 ${error ? "border border-red-200 bg-red-50 text-red-700" : "border border-[#cce4d1] bg-[#eff8f0] text-[#286b42]"}`}>{error || success}</div>;
}

function SubmitButton({ busy, children }) {
  return <button className="button-primary w-full py-3 text-sm disabled:opacity-60" type="submit" disabled={busy}>{busy ? "Memproses…" : children}</button>;
}

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login gagal.");
      router.push("/admin"); router.refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <AuthLayout title="Masuk ke panel admin" subtitle="Kelola transaksi dan pantau rekap anggaran desa.">
    <Notice error={error} />
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="form-label">Username</span><span className="relative block"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97a39b]" size={16} /><input className="input-control !py-3 !pl-10 text-sm" name="username" autoComplete="username" required placeholder="username admin" /></span></label>
      <label className="block"><span className="form-label">Password</span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97a39b]" size={16} /><input className="input-control !py-3 !pl-10 text-sm" name="password" type="password" autoComplete="current-password" required placeholder="Masukkan password" /></span></label>
      <div className="flex justify-end"><Link href="/forgot-password" className="text-xs font-bold text-[#39704e] hover:underline">Lupa password?</Link></div>
      <SubmitButton busy={busy}>Masuk aman</SubmitButton>
    </form>
    <div className="mt-6 rounded-xl bg-[#f6f8f4] p-3.5 text-xs leading-5 text-[#6b7d70]">Admin pertama? <Link href="/setup-admin" className="font-bold text-[#286b4d] hover:underline">Buat akun admin awal</Link>. Halaman setup hanya aktif sebelum admin dibuat.</div>
  </AuthLayout>;
}

export function SetupAdminForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const values = { setupToken: form.get("setupToken"), username: form.get("username"), email: form.get("email"), password: form.get("password") };
    if (values.password !== form.get("confirmPassword")) { setError("Konfirmasi password tidak sama."); setBusy(false); return; }
    try {
      const response = await fetch("/api/auth/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Setup admin gagal.");
      setSuccess("Akun admin berhasil dibuat. Silakan masuk.");
      setTimeout(() => router.push("/login"), 900);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <AuthLayout title="Buat admin pertama" subtitle="Setup ini hanya bisa digunakan sekali. Buat akun pengelola untuk mulai mengisi transaksi.">
    <Notice error={error} success={success} />
    <div className="mb-4 rounded-xl border border-[#e9e6d9] bg-[#fbf8ed] p-3 text-xs leading-5 text-[#786b43]">Token setup ada di file <code className="font-bold">.env.local</code> pada folder proyek. Jangan bagikan token ini.</div>
    <form onSubmit={submit} className="space-y-3.5">
      <label className="block"><span className="form-label">Token setup</span><input className="input-control !py-3 text-sm" name="setupToken" type="password" autoComplete="off" required /></label>
      <label className="block"><span className="form-label">Username</span><input className="input-control !py-3 text-sm" name="username" autoComplete="username" required minLength={3} maxLength={40} /></label>
      <label className="block"><span className="form-label">Email admin <span className="font-normal text-[#8b9890]">(untuk reset password)</span></span><input className="input-control !py-3 text-sm" name="email" type="email" autoComplete="email" required /></label>
      <label className="block"><span className="form-label">Password <span className="font-normal text-[#8b9890]">(minimal 12 karakter)</span></span><input className="input-control !py-3 text-sm" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
      <label className="block"><span className="form-label">Ulangi password</span><input className="input-control !py-3 text-sm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
      <div className="pt-1"><SubmitButton busy={busy}>Buat akun admin</SubmitButton></div>
    </form>
  </AuthLayout>;
}

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    const email = new FormData(event.currentTarget).get("email");
    try {
      const response = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Permintaan reset gagal.");
      setSuccess(data.message || "Jika email terdaftar, tautan reset akan dikirim.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <AuthLayout title="Reset password" subtitle="Masukkan email admin. Kami akan mengirim tautan reset yang berlaku selama 30 menit.">
    <Notice error={error} success={success} />
    <form onSubmit={submit} className="space-y-4"><label className="block"><span className="form-label">Email admin</span><span className="relative block"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97a39b]" size={16} /><input className="input-control !py-3 !pl-10 text-sm" type="email" name="email" autoComplete="email" required placeholder="nama@email.com" /></span></label><SubmitButton busy={busy}>Kirim tautan reset</SubmitButton></form>
    <p className="mt-5 text-center text-xs text-[#7a8980]">Ingat password? <Link href="/login" className="font-bold text-[#39704e] hover:underline">Kembali masuk</Link></p>
  </AuthLayout>;
}

export function ResetPasswordForm({ token }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) { setError("Konfirmasi password tidak sama."); setBusy(false); return; }
    try {
      const response = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reset password gagal.");
      setSuccess("Password berhasil diubah. Mengalihkan ke halaman login…");
      setTimeout(() => router.push("/login"), 1100);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <AuthLayout title="Buat password baru" subtitle="Gunakan password kuat minimal 12 karakter. Tautan reset hanya bisa dipakai sekali.">
    <Notice error={error} success={success} />
    {!token ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">Token reset tidak ditemukan. Minta tautan reset baru dari halaman lupa password.</div> : <form onSubmit={submit} className="space-y-4"><label className="block"><span className="form-label">Password baru</span><span className="relative block"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97a39b]" size={16} /><input className="input-control !py-3 !pl-10 text-sm" type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={128} /></span></label><label className="block"><span className="form-label">Ulangi password</span><input className="input-control !py-3 text-sm" type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={128} /></label><SubmitButton busy={busy}><CheckCircle2 size={16} /> Simpan password baru</SubmitButton></form>}
  </AuthLayout>;
}
