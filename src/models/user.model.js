import mongoose from "mongoose";
import { BaseModel } from "./base.model.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const refreshTokenSchema = new mongoose.Schema({
    id: { type: String, required: true },
    expiresAt: { type: Number, required: true },
    createdAt: { type: Number, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: (v) => EMAIL_REGEX.test(v),
            message: "Invalid email format",
        },
    },
    name: {
        type: String,
        trim: true,
        default: null,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    refreshTokens: {
        type: [refreshTokenSchema],
        default: [],
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash;
            delete ret.refreshTokens;
            return ret;
        },
    },
});

const UserModel = mongoose.model("User", userSchema);

class UserRepository extends BaseModel {
    constructor() {
        super(UserModel);
    }

    async findByEmail(email) {
        return this.findOne({ email: email.trim().toLowerCase() });
    }

    async addRefreshToken(userId, token) {
        const user = await this.findById(userId);
        if (!user) return false;

        user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > Date.now());
        
        if (user.refreshTokens.length >= 5) {
            user.refreshTokens.shift();
        }
        
        user.refreshTokens.push(token);
        await user.save();
        return true;
    }

    async removeRefreshToken(userId, tokenId) {
        const result = await this.updateOne(
            { _id: userId },
            { $pull: { refreshTokens: { id: tokenId } } }
        );
        return result.modifiedCount > 0;
    }

    async removeAllRefreshTokens(userId) {
        const result = await this.updateOne(
            { _id: userId },
            { $set: { refreshTokens: [] } }
        );
        return result.modifiedCount > 0;
    }

    async findRefreshToken(userId, tokenId) {
        const user = await this.findById(userId);
        if (!user) return null;
        
        return user.refreshTokens.find(t => t.id === tokenId && t.expiresAt > Date.now()) || null;
    }
}

export const userRepository = new UserRepository();
export { UserModel };
export default userRepository;
