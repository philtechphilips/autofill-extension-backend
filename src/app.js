import express from "express";
import cors from "cors";
import config from "./config/index.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

app.use("/api", routes);

// Backward compatibility: keep old routes working
app.get("/health", (req, res) => res.redirect("/api/health"));
app.post("/analyze-form", (req, res) => {
    req.url = "/api/form/analyze";
    app.handle(req, res);
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
