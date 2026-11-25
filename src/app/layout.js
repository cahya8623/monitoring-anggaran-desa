import "./globals.css";

export const metadata = {
  title: { default: "Ruang Anggaran Desa", template: "%s | Ruang Anggaran Desa" },
  description: "Transparansi anggaran desa untuk semua warga.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
