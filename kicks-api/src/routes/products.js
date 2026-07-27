import { Router } from "express";
import {
  getProducts,
  getProductDetail,
  getProductDetailBySlug,
  getProductsForAdmin,
  postProduct,
  patchProduct,
  removeProduct,
} from "../controllers/productController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getProducts);


router.get("/admin", requireAdmin, getProductsForAdmin);
router.post("/", requireAdmin, postProduct);
router.patch("/:id", requireAdmin, patchProduct);
router.delete("/:id", requireAdmin, removeProduct);

router.get("/slug/:slug", getProductDetailBySlug);
router.get("/:id", getProductDetail);

export default router;