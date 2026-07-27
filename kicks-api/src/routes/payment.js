import { Router } from "express";
import {
  postCreateTransaction,
  postMidtransNotification,
  getOrderStatus,
  getOrderHistory,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/transaksi", requireAuth, postCreateTransaction);

router.post("/notifikasi", postMidtransNotification);

router.get("/order/:orderId", getOrderStatus);

router.get("/riwayat", requireAuth, getOrderHistory);

export default router;