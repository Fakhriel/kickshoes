import { Router } from "express";
import { getDestinations, postCalculateCost } from "../controllers/ongkirController.js";

const router = Router();

router.get("/destinasi", getDestinations);
router.post("/cek", postCalculateCost);

export default router;
