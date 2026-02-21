import dotenv from "dotenv";

dotenv.config();

const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 3000,

    ai: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com",
        model: process.env.AI_MODEL || "deepseek-chat",
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },

    cors: {
        origin: process.env.CORS_ORIGIN || "*",
    },
};

export default config;
