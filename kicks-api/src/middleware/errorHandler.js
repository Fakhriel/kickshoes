export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.path} tidak ditemukan.` });
}

export function errorHandler(err, req, res, next) {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
}
