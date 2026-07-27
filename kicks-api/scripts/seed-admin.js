// One-off script: bikin 1 akun admin (superadmin) di tabel admins.
// Jalankan SEKALI saja setelah sql/07_create_admins.sql dijalankan.
//
// Cara pakai (dari folder kicks-api):
//   node scripts/seed-admin.js
//
// Ganti USERNAME, NAME, PASSWORD di bawah sesuai keinginan SEBELUM
// menjalankan, atau jalankan dulu lalu ganti password-nya lewat
// database langsung / endpoint ganti password nanti.

import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { pool } from "../src/config/database.js";

const USERNAME = "superadmin";
const NAME = "Super Admin";
const PASSWORD = "stride@2026"; // GANTI ini sebelum dipakai di production

async function run() {
  const [existing] = await pool.query(
    "SELECT id FROM admins WHERE username = ?",
    [USERNAME]
  );

  if (existing.length > 0) {
    console.log(`[seed-admin] Username "${USERNAME}" sudah ada, tidak dibuat ulang.`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const id = randomUUID();

  await pool.query(
    "INSERT INTO admins (id, username, name, password_hash) VALUES (?, ?, ?, ?)",
    [id, USERNAME, NAME, passwordHash]
  );

  console.log(`[seed-admin] Admin "${USERNAME}" berhasil dibuat.`);
  console.log(`[seed-admin] Login pakai username: ${USERNAME} / password: ${PASSWORD}`);
  console.log(`[seed-admin] SARAN: ganti password ini setelah login pertama kali.`);

  await pool.end();
}

run().catch((err) => {
  console.error("[seed-admin] Gagal:", err);
  process.exit(1);
});