import { Router } from "express";
import { settingsRepository } from "../models/settings.model.js";
import { success, error } from "../utils/response.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const settings = await settingsRepository.getSettings();

        return success(res, {
            tokenCosts: settings.tokenCosts,
            packs: settings.packs.filter((p) => p.isActive),
        });
    } catch (err) {
        return error(res, "Failed to get pricing information");
    }
});

export default router;
