import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, findUserById, createUser } from "../db/userQueries.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Bentuk user yang aman dikirim ke client — TIDAK PERNAH menyertakan
// passwordHash, walau cuma untuk dibandingkan di frontend.
function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar. Coba masuk." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = randomUUID();

    await createUser({ id, name: name.trim(), email: normalizedEmail, passwordHash });

    const user = { id, name: name.trim(), email: normalizedEmail };
    const token = signToken(user);

    res.status(201).json({ data: { token, user: toPublicUser(user) } });
  } catch (err) {
    console.error("[register] error:", err);
    res.status(500).json({ error: "Gagal membuat akun." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    // Pesan error SENGAJA dibuat sama persis untuk "email tidak ada" dan
    // "password salah" — supaya orang yang coba menebak-nebak tidak bisa
    // memakai pesan error untuk mencari tahu email mana yang terdaftar.
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const token = signToken(user);
    res.json({ data: { token, user: toPublicUser(user) } });
  } catch (err) {
    console.error("[login] error:", err);
    res.status(500).json({ error: "Gagal masuk." });
  }
}

// Dipanggil frontend saat reload halaman untuk verifikasi token yang
// tersimpan masih valid, dan untuk dapatkan data user terbaru.
export async function me(req, res) {
  try {
    // req.userId di-set oleh middleware requireAuth (lihat middleware/auth.js)
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }
    res.json({ data: toPublicUser(user) });
  } catch (err) {
    console.error("[me] error:", err);
    res.status(500).json({ error: "Gagal mengambil data user." });
  }
}