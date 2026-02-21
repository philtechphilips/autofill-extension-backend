import mongoose from "mongoose";
import { BaseModel } from "./base.model.js";

const usageEventSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["form_fill", "cv_parse", "text_enhance"],
            required: true,
            index: true,
        },
        domain: {
            type: String,
            trim: true,
            default: null,
        },
        pageTitle: {
            type: String,
            trim: true,
            maxlength: 200,
            default: null,
        },
        fieldCount: {
            type: Number,
            default: 0,
        },
        success: {
            type: Boolean,
            default: true,
        },
        profileId: {
            type: String,
            default: null,
        },
        fillMode: {
            type: String,
            enum: ["ai_only", "profile_only", "merged", null],
            default: null,
        },
        metadata: {
            enhanceType: { type: String, default: null },
            fieldsSkipped: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

usageEventSchema.index({ userId: 1, createdAt: -1 });
usageEventSchema.index({ userId: 1, type: 1 });

const UsageEventModel = mongoose.model("UsageEvent", usageEventSchema);

class UsageEventRepository extends BaseModel {
    constructor() {
        super(UsageEventModel);
    }

    async findByUserId(userId, options = {}) {
        const { page = 1, limit = 20, type } = options;
        const skip = (page - 1) * limit;
        const query = { userId };
        if (type) query.type = type;

        const [events, total] = await Promise.all([
            this.find(query, { sort: { createdAt: -1 }, limit, skip }),
            this.count(query),
        ]);

        return {
            events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getRecentEvents(userId, limit = 6) {
        return this.find({ userId }, { sort: { createdAt: -1 }, limit });
    }

    async getDailyStats(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        return this.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                    fieldsFilled: { $sum: "$fieldCount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    }
}

const userStatsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        totalFills: {
            type: Number,
            default: 0,
        },
        totalSuccessfulFills: {
            type: Number,
            default: 0,
        },
        totalFieldsFilled: {
            type: Number,
            default: 0,
        },
        totalCVParses: {
            type: Number,
            default: 0,
        },
        totalEnhancements: {
            type: Number,
            default: 0,
        },
        estimatedTimeSavedSeconds: {
            type: Number,
            default: 0,
        },
        lastActivityAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const UserStatsModel = mongoose.model("UserStats", userStatsSchema);

class UserStatsRepository extends BaseModel {
    constructor() {
        super(UserStatsModel);
    }

    async findByUserId(userId) {
        return this.findOne({ userId });
    }

    async getOrCreate(userId) {
        let stats = await this.findByUserId(userId);
        if (!stats) {
            stats = await this.create({ userId });
        }
        return stats;
    }

    async incrementStats(userId, updates) {
        const now = new Date();
        const incrementFields = {};

        Object.keys(updates).forEach((key) => {
            if (typeof updates[key] === "number") {
                incrementFields[key] = updates[key];
            }
        });

        return this.findOneAndUpdate(
            { userId },
            {
                $inc: incrementFields,
                $set: { lastActivityAt: now },
            },
            { upsert: true, new: true }
        );
    }
}

export const usageEventRepository = new UsageEventRepository();
export const userStatsRepository = new UserStatsRepository();
export { UsageEventModel, UserStatsModel };
