import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kicks_lab",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

/**
 * Cek koneksi database saat server start. Dipanggil sekali di server.js
 */
export async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log("[db] Koneksi MySQL berhasil.");
  } finally {
    connection.release();
  }
}
