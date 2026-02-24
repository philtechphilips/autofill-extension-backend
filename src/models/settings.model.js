import mongoose from "mongoose";

const DEFAULT_PACKS = [
    {
        packId: "welcome",
        name: "Welcome Pack",
        tokens: 50,
        priceNGN: 0,
        priceUSD: 0,
        isActive: true,
    },
    {
        packId: "pro",
        name: "Pro Pack",
        tokens: 750,
        priceNGN: 2500,
        priceUSD: 2.5,
        isActive: true,
    },
    {
        packId: "elite",
        name: "Elite Pack",
        tokens: 2000,
        priceNGN: 5000,
        priceUSD: 5.0,
        isActive: true,
    },
];

const DEFAULT_TOKEN_COSTS = {
    formAnalysis: 1,
    textEnhancement: 1,
    textGeneration: 1,
    cvParsing: 1,
    profileUsage: 1,
};

const packSchema = new mongoose.Schema(
    {
        packId: {
            type: String,
            required: true,
            enum: ["welcome", "pro", "elite"],
        },
        name: {
            type: String,
            required: true,
        },
        tokens: {
            type: Number,
            required: true,
            min: 0,
        },
        priceNGN: {
            type: Number,
            required: true,
            min: 0,
        },
        priceUSD: {
            type: Number,
            required: true,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        polarProductId: {
            type: String,
            default: null,
        },
    },
    { _id: false }
);

const tokenCostsSchema = new mongoose.Schema(
    {
        formAnalysis: {
            type: Number,
            default: 1,
            min: 0,
        },
        textEnhancement: {
            type: Number,
            default: 1,
            min: 0,
        },
        textGeneration: {
            type: Number,
            default: 1,
            min: 0,
        },
        cvParsing: {
            type: Number,
            default: 1,
            min: 0,
        },
        profileUsage: {
            type: Number,
            default: 1,
            min: 0,
        },
    },
    { _id: false }
);

const settingsSchema = new mongoose.Schema(
    {
        tokenCosts: {
            type: tokenCostsSchema,
            default: () => DEFAULT_TOKEN_COSTS,
        },
        packs: {
            type: [packSchema],
            default: () => DEFAULT_PACKS,
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

const SettingsModel = mongoose.model("Settings", settingsSchema);

class SettingsRepository {
    constructor() {
        this.model = SettingsModel;
    }

    async getSettings() {
        let settings = await this.model.findOne();
        if (!settings) {
            settings = await this.model.create({
                tokenCosts: DEFAULT_TOKEN_COSTS,
                packs: DEFAULT_PACKS,
            });
        }
        return settings;
    }

    async updateTokenCosts(tokenCosts) {
        const settings = await this.getSettings();

        if (!settings.tokenCosts) {
            settings.tokenCosts = { ...DEFAULT_TOKEN_COSTS };
        }

        if (tokenCosts.formAnalysis !== undefined) {
            settings.tokenCosts.formAnalysis = tokenCosts.formAnalysis;
        }
        if (tokenCosts.textEnhancement !== undefined) {
            settings.tokenCosts.textEnhancement = tokenCosts.textEnhancement;
        }
        if (tokenCosts.textGeneration !== undefined) {
            settings.tokenCosts.textGeneration = tokenCosts.textGeneration;
        }
        if (tokenCosts.cvParsing !== undefined) {
            settings.tokenCosts.cvParsing = tokenCosts.cvParsing;
        }
        if (tokenCosts.profileUsage !== undefined) {
            settings.tokenCosts.profileUsage = tokenCosts.profileUsage;
        }

        settings.markModified("tokenCosts");
        await settings.save();
        return settings;
    }

    async updatePack(packId, packData) {
        const settings = await this.getSettings();
        const packIndex = settings.packs.findIndex((p) => p.packId === packId);

        if (packIndex === -1) {
            return null;
        }

        const pack = settings.packs[packIndex];
        if (packData.name !== undefined) pack.name = packData.name;
        if (packData.tokens !== undefined) pack.tokens = packData.tokens;
        if (packData.priceNGN !== undefined) pack.priceNGN = packData.priceNGN;
        if (packData.priceUSD !== undefined) pack.priceUSD = packData.priceUSD;
        if (packData.isActive !== undefined) pack.isActive = packData.isActive;
        if (packData.polarProductId !== undefined) pack.polarProductId = packData.polarProductId;

        await settings.save();
        return settings;
    }

    async getPack(packId) {
        const settings = await this.getSettings();
        return settings.packs.find((p) => p.packId === packId) || null;
    }

    async getPackByPolarProductId(polarProductId) {
        const settings = await this.getSettings();
        return settings.packs.find((p) => p.polarProductId === polarProductId) || null;
    }

    async getActivePacks() {
        const settings = await this.getSettings();
        return settings.packs.filter((p) => p.isActive);
    }

    async getTokenCosts() {
        const settings = await this.getSettings();
        return settings.tokenCosts;
    }
}

export const settingsRepository = new SettingsRepository();
export { SettingsModel };
export default settingsRepository;
