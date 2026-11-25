import nodemailer from "nodemailer";

export function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

export async function sendResetEmail({ to, resetUrl }) {
  if (!hasSmtpConfig()) throw new Error("SMTP belum dikonfigurasi. Lengkapi variabel SMTP di .env.local.");
  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Atur ulang password admin — Ruang Anggaran Desa",
    text: `Kami menerima permintaan untuk mengatur ulang password akun admin.\n\nBuka tautan ini dalam 30 menit:\n${resetUrl}\n\nJika bukan kamu yang meminta, abaikan email ini.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#16372c"><h2>Atur ulang password</h2><p>Kami menerima permintaan untuk mengatur ulang password akun admin.</p><p><a href="${resetUrl}" style="display:inline-block;background:#16664b;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">Buat password baru</a></p><p>Tautan berlaku selama 30 menit. Jika kamu tidak meminta reset, abaikan email ini.</p></div>`,
  });
}
