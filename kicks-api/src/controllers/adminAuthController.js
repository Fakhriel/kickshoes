import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { findAdminByUsername, findAdminById } from "../db/adminQueries.js";



function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function toPublicAdmin(admin) {
  return { id: admin.id, username: admin.username, name: admin.name };
}

export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    const admin = await findAdminByUsername(String(username).trim().toLowerCase());

  
    if (!admin) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const token = signAdminToken(admin);
    res.json({ data: { token, admin: toPublicAdmin(admin) } });
  } catch (err) {
    console.error("[adminLogin] error:", err);
    res.status(500).json({ error: "Gagal masuk." });
  }
}

// Dipanggil dashboard saat reload halaman untuk verifikasi token admin
// masih valid. req.adminId di-set oleh middleware requireAdmin.
export async function adminMe(req, res) {
  try {
    const admin = await findAdminById(req.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin tidak ditemukan." });
    }
    res.json({ data: toPublicAdmin(admin) });
  } catch (err) {
    console.error("[adminMe] error:", err);
    res.status(500).json({ error: "Gagal mengambil data admin." });
  }
}