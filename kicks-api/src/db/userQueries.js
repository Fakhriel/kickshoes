// Layer query untuk tabel users.

import { pool } from "../config/database.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash AS passwordHash, google_id AS googleId, facebook_id AS facebookId
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, google_id AS googleId, facebook_id AS facebookId, created_at AS createdAt
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser({ id, name, email, passwordHash }) {
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)`,
    [id, name, email, passwordHash]
  );
}