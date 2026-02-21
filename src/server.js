import app from "./app.js";
import config from "./config/index.js";

const start = async () => {
    try {
        app.listen(config.port, () => {
            console.log(`[Server] Running on http://localhost:${config.port}`);
            console.log(`[Server] Environment: ${config.env}`);
        });
    } catch (err) {
        console.error("[Server] Failed to start:", err);
        process.exit(1);
    }
};

start();
