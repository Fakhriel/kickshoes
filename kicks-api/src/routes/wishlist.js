import { Router } from "express";
import { getWishlist, postWishlistItem, deleteWishlistItem } from "../controllers/wishlistController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Semua endpoint wishlist wajib login.
router.get("/", requireAuth, getWishlist);
router.post("/", requireAuth, postWishlistItem);
router.delete("/:productId", requireAuth, deleteWishlistItem);

export default router;