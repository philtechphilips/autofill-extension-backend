import mongoose from "mongoose";
import { BaseModel } from "./base.model.js";

const profileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Profile name is required"],
            trim: true,
            maxlength: 100,
        },
        encryptedData: {
            type: String,
            required: true,
        },
        iv: {
            type: String,
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
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

profileSchema.index({ userId: 1, name: 1 }, { unique: true });

const ProfileModel = mongoose.model("Profile", profileSchema);

class ProfileRepository extends BaseModel {
    constructor() {
        super(ProfileModel);
    }

    async findByUserId(userId) {
        return this.find({ userId });
    }

    async findByUserIdAndName(userId, name) {
        return this.findOne({ userId, name });
    }

    async findDefaultProfile(userId) {
        return this.findOne({ userId, isDefault: true });
    }

    async setDefaultProfile(userId, profileId) {
        await this.model.updateMany({ userId }, { isDefault: false });
        return this.findByIdAndUpdate(profileId, { isDefault: true });
    }

    async deleteAllByUserId(userId) {
        return this.model.deleteMany({ userId });
    }
}

export const profileRepository = new ProfileRepository();
export { ProfileModel };
export default profileRepository;
