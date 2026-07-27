import { Router } from "express";
import { getProducts, getProductDetail, getProductDetailBySlug } from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);

router.get("/slug/:slug", getProductDetailBySlug);
router.get("/:id", getProductDetail);

export default router;
