// Layer query untuk tabel admins. TERPISAH dari userQueries.js
// (tabel customer) secara sengaja — lihat catatan di sql/07_create_admins.sql.

import { pool } from "../config/database.js";

export async function findAdminByUsername(username) {
  const [rows] = await pool.query(
    `SELECT id, username, name, password_hash AS passwordHash
     FROM admins
     WHERE username = ?
     LIMIT 1`,
    [username]
  );
  return rows[0] ?? null;
}

export async function findAdminById(id) {
  const [rows] = await pool.query(
    `SELECT id, username, name, created_at AS createdAt
     FROM admins
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}