import "dotenv/config";
import express from "express";
import cors from "cors";

import { testConnection } from "./config/database.js";
import productsRouter from "./routes/products.js";
import ongkirRouter from "./routes/ongkir.js";
import paymentRouter from "./routes/payment.js";
import authRouter from "./routes/auth.js";
import wishlistRouter from "./routes/wishlist.js";
import cartRouter from "./routes/cart.js";
import adminAuthRouter from "./routes/adminAuth.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: hanya izinkan origin frontend Astro yang dipakai untuk dev/production.
// Default mencakup kicks-lab (4321) DAN kick-dashboard (4322) sekaligus —
// kalau cuma satu yang diizinkan, request dari yang satunya akan diblok
// browser walau backend & route-nya sendiri sudah benar.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:4321,http://localhost:4322")
  .split(",")
  .map((url) => url.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/ongkir", ongkirRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/auth", authRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin-auth", adminAuthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`[server] Kicks API jalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] Gagal start, cek koneksi database:", err.message);
    process.exit(1);
  }
}

start();