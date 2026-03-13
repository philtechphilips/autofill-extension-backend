import cron from "node-cron";
import { UserModel } from "../models/user.model.js";
import {
    sendFollowupDay1Email,
    sendFollowupDay3Email,
    sendFollowupDay14Email,
} from "./email.service.js";

/**
 * Returns the UTC start and end of a calendar day that is `daysAgo` before today.
 */
function getTargetDayRange(daysAgo) {
    const now = new Date();
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, 0, 0, 0, 0)
    );
    const end = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - daysAgo,
            23,
            59,
            59,
            999
        )
    );
    console.log(start, end);
    return { start, end };
}

async function sendFollowupBatch(daysAgo, flagField, sendFn, label) {
    const { start, end } = getTargetDayRange(daysAgo);

    const filter = {
        isEmailVerified: true,
        createdAt: { $gte: start, $lte: end },
        [`followupEmailsSent.${flagField}`]: { $ne: true },
    };

    const users = await UserModel.find(filter).select("email name followupEmailsSent").lean();

    if (users.length === 0) {
        console.log(`[Followup] No users eligible for ${label} email.`);
        return;
    }

    console.log(`[Followup] Sending ${label} email to ${users.length} user(s)...`);

    for (const user of users) {
        const result = await sendFn(user.email, { name: user.name });

        if (result.success) {
            await UserModel.updateOne(
                { _id: user._id },
                { $set: { [`followupEmailsSent.${flagField}`]: true } }
            );
        } else {
            console.error(
                `[Followup] Failed to send ${label} email to ${user.email}:`,
                result.error
            );
        }
    }

    console.log(`[Followup] ${label} batch complete.`);
}

export function initFollowupCrons() {
    // Runs at midnight UTC every day
    cron.schedule(
        "0 0 * * *",
        async () => {
            console.log("[Followup] Running midnight follow-up cron jobs...");
            try {
                await Promise.all([
                    sendFollowupBatch(1, "day1", sendFollowupDay1Email, "day-1"),
                    sendFollowupBatch(3, "day3", sendFollowupDay3Email, "day-3"),
                    sendFollowupBatch(14, "day14", sendFollowupDay14Email, "day-14"),
                ]);
            } catch (err) {
                console.error("[Followup] Cron job error:", err);
            }
        },
        { timezone: "UTC" }
    );

    console.log("[Followup] Cron jobs scheduled (daily at 00:00 UTC).");
}
