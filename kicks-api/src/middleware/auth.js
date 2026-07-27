import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Belum login. Silakan masuk terlebih dahulu." });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesi login tidak valid atau sudah kedaluwarsa." });
  }
}

// Pasang di route khusus dashboard admin (mis. create/update/delete
// produk). Beda dari requireAuth: token HARUS punya klaim "role: admin"
// (lihat adminAuthController.js) — token customer biasa, walau valid
// dan ditandatangani dengan JWT_SECRET yang sama, akan DITOLAK di sini
// karena tidak punya klaim itu. req.adminId terisi kalau lolos.
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Belum login sebagai admin." });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Akses ditolak. Bukan akun admin." });
    }

    req.adminId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesi login admin tidak valid atau sudah kedaluwarsa." });
  }
}