import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.",
  },
});

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.",
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Terlalu banyak percobaan daftar akun. Coba lagi dalam 1 jam.",
  },
});