import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const generateSecret = () => crypto.randomBytes(64).toString("hex");

const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 3000,

    db: {
        url: process.env.DB_URL || "mongodb://localhost:27017/autofillai",
    },

    ai: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com",
        model: process.env.AI_MODEL || "deepseek-chat",
    },

    jwt: {
        secret: process.env.JWT_SECRET || generateSecret(),
        refreshSecret: process.env.JWT_REFRESH_SECRET || generateSecret(),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },

    cors: {
        origin: process.env.CORS_ORIGIN || "*",
    },
};

if (config.env === "production" && !process.env.JWT_SECRET) {
    console.warn("[Warning] JWT_SECRET not set in production. Using generated secret (will change on restart).");
}

export default config;
