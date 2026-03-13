import app from "./app.js";
import config from "./config/index.js";
import { connectDB } from "./config/database.js";
import { polarService } from "./services/polar.service.js";
import { initFollowupCrons } from "./services/followup.service.js";

const start = async () => {
    try {
        await connectDB();

        if (polarService.initialize()) {
            console.log(`[Polar] Initialized (${config.polar.server} mode)`);
        }

        initFollowupCrons();

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
