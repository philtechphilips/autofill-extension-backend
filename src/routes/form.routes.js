import { Router } from "express";
import { analyzeForm } from "../controllers/form.controller.js";

const router = Router();

router.post("/analyze", analyzeForm);

export default router;
