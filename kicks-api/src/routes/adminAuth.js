import { Router } from "express";
import { adminLogin, adminMe } from "../controllers/adminAuthController.js";
import { requireAdmin } from "../middleware/auth.js";
import { adminLoginLimiter } from "../middleware/rateLimiter.js";

const router = Router();


router.post("/login", adminLogin);
router.get("/me", requireAdmin, adminMe);

export default router;