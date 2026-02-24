import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import config from "./config/index.js";
import swaggerSpec from "./config/swagger.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Trust proxy for rate limiting behind reverse proxy (nginx, cloudflare, etc.)
app.set("trust proxy", 1);

app.use(
    cors({
        origin: config.cors.origin,
        credentials: true,
    })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Global rate limiter - applies to all routes
app.use(globalLimiter);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Autofill.AI API Docs",
    })
);
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api/v1", routes);

// Backward compatibility: keep old routes working
app.get("/health", (req, res) => res.redirect("/api/v1/health"));
app.post("/analyze-form", (req, res) => {
    req.url = "/api/v1/form/analyze";
    app.handle(req, res);
});
app.use("/api", (req, res) => res.redirect(307, `/api/v1${req.url}`));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
