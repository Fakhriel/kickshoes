import { Router } from "express";
import { getCart, postCartItem, patchCartItem, deleteCartItem } from "../controllers/cartController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Semua endpoint keranjang wajib login.
router.get("/", requireAuth, getCart);
router.post("/", requireAuth, postCartItem);
router.patch("/:cartItemId", requireAuth, patchCartItem);
router.delete("/:cartItemId", requireAuth, deleteCartItem);

export default router;