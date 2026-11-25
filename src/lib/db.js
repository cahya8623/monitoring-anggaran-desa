import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const sampleRows = [
  ["2023-01-12", 2023, "income", "Transfer Pemerintah Pusat", "Dana Desa tahap I", 1200000000, "Data simulasi portofolio"],
  ["2023-02-18", 2023, "income", "Pendapatan Asli Desa", "Hasil usaha dan sewa aset desa", 45000000, "Data simulasi portofolio"],
  ["2023-05-08", 2023, "income", "Transfer Pemerintah Daerah", "Bagi hasil pajak daerah", 80000000, "Data simulasi portofolio"],
  ["2023-09-20", 2023, "income", "Transfer Pemerintah Daerah", "Bantuan keuangan kabupaten", 120000000, "Data simulasi portofolio"],
  ["2023-02-07", 2023, "expense", "Pembangunan", "Peningkatan jalan lingkungan", 510000000, "Data simulasi portofolio"],
  ["2023-03-14", 2023, "expense", "Kesehatan", "Pengadaan alat kesehatan posyandu", 135000000, "Data simulasi portofolio"],
  ["2023-05-22", 2023, "expense", "Pendidikan", "Dukungan kegiatan PAUD desa", 160000000, "Data simulasi portofolio"],
  ["2023-08-10", 2023, "expense", "Perlindungan Sosial", "Bantuan langsung tunai desa", 110000000, "Data simulasi portofolio"],
  ["2023-11-03", 2023, "expense", "Pemerintahan Desa", "Operasional dan pelayanan warga", 290000000, "Data simulasi portofolio"],
  ["2024-01-15", 2024, "income", "Transfer Pemerintah Pusat", "Dana Desa tahap I", 1280000000, "Data simulasi portofolio"],
  ["2024-02-12", 2024, "income", "Pendapatan Asli Desa", "Hasil usaha dan sewa aset desa", 60000000, "Data simulasi portofolio"],
  ["2024-05-06", 2024, "income", "Transfer Pemerintah Daerah", "Bagi hasil pajak daerah", 95000000, "Data simulasi portofolio"],
  ["2024-09-17", 2024, "income", "Transfer Pemerintah Daerah", "Bantuan keuangan kabupaten", 145000000, "Data simulasi portofolio"],
  ["2024-02-20", 2024, "expense", "Pembangunan", "Perbaikan jalan dan drainase", 420000000, "Data simulasi portofolio"],
  ["2024-04-03", 2024, "expense", "Pembangunan", "Pembangunan sarana air bersih", 280000000, "Data simulasi portofolio"],
  ["2024-05-16", 2024, "expense", "Kesehatan", "Revitalisasi posyandu desa", 145000000, "Data simulasi portofolio"],
  ["2024-07-11", 2024, "expense", "Pendidikan", "Bantuan perlengkapan belajar PAUD", 180000000, "Data simulasi portofolio"],
  ["2024-09-09", 2024, "expense", "Perlindungan Sosial", "Bantuan langsung tunai desa", 210000000, "Data simulasi portofolio"],
  ["2024-11-21", 2024, "expense", "Pemerintahan Desa", "Operasional dan pelayanan warga", 245000000, "Data simulasi portofolio"],
  ["2025-01-14", 2025, "income", "Transfer Pemerintah Pusat", "Dana Desa tahap I", 1350000000, "Data simulasi portofolio"],
  ["2025-02-13", 2025, "income", "Pendapatan Asli Desa", "Hasil usaha dan sewa aset desa", 72000000, "Data simulasi portofolio"],
  ["2025-05-12", 2025, "income", "Transfer Pemerintah Daerah", "Bagi hasil pajak daerah", 108000000, "Data simulasi portofolio"],
  ["2025-09-19", 2025, "income", "Transfer Pemerintah Daerah", "Bantuan keuangan kabupaten", 155000000, "Data simulasi portofolio"],
  ["2025-02-18", 2025, "expense", "Pembangunan", "Peningkatan jalan usaha tani", 480000000, "Data simulasi portofolio"],
  ["2025-04-22", 2025, "expense", "Pembangunan", "Perluasan jaringan air bersih", 330000000, "Data simulasi portofolio"],
  ["2025-05-26", 2025, "expense", "Kesehatan", "Dukungan layanan posyandu", 155000000, "Data simulasi portofolio"],
  ["2025-07-17", 2025, "expense", "Pendidikan", "Bantuan sarana belajar PAUD", 195000000, "Data simulasi portofolio"],
  ["2025-09-11", 2025, "expense", "Perlindungan Sosial", "Bantuan langsung tunai desa", 225000000, "Data simulasi portofolio"],
  ["2025-11-20", 2025, "expense", "Pemerintahan Desa", "Operasional dan pelayanan warga", 260000000, "Data simulasi portofolio"],
];

function createDatabase() {
  const filename = path.join(process.cwd(), "data", "anggaran-desa.sqlite");
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      session_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      activity TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_year_date ON transactions(year, date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const seeded = db.prepare("SELECT value FROM app_meta WHERE key = 'demo_seed_v1'").get();
  if (!seeded) {
    const insert = db.prepare(`INSERT INTO transactions (date, year, type, category, activity, amount, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const seed = db.transaction(() => {
      for (const row of sampleRows) insert.run(...row);
      db.prepare("INSERT INTO app_meta (key, value) VALUES ('demo_seed_v1', 'complete')").run();
    });
    seed();
  }
  return db;
}

export function getDb() {
  if (!globalThis.__villageBudgetDb) globalThis.__villageBudgetDb = createDatabase();
  return globalThis.__villageBudgetDb;
}
