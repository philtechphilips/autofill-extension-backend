import { Router } from "express";
import { success } from "../utils/response.js";

const router = Router();

// Placeholder routes - implement controllers when adding auth service
router.post("/register", (req, res) => {
    // TODO: Implement registration
    success(res, { message: "Registration endpoint - not yet implemented" });
});

router.post("/login", (req, res) => {
    // TODO: Implement login
    success(res, { message: "Login endpoint - not yet implemented" });
});

router.post("/logout", (req, res) => {
    // TODO: Implement logout
    success(res, { message: "Logout endpoint - not yet implemented" });
});

router.post("/refresh", (req, res) => {
    // TODO: Implement token refresh
    success(res, { message: "Refresh endpoint - not yet implemented" });
});

router.get("/me", (req, res) => {
    // TODO: Implement get current user
    success(res, { message: "Get user endpoint - not yet implemented" });
});

export default router;
