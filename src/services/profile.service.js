import profileRepository from "../models/profile.model.js";

const MAX_PROFILES_PER_USER = 10;

export const createProfile = async (userId, { name, encryptedData, iv }) => {
    if (!name || !encryptedData || !iv) {
        return { error: "Name, encrypted data, and IV are required", status: 400 };
    }

    const existingProfiles = await profileRepository.findByUserId(userId);

    if (existingProfiles.length >= MAX_PROFILES_PER_USER) {
        return {
            error: `Maximum of ${MAX_PROFILES_PER_USER} profiles allowed`,
            status: 400,
        };
    }

    const existingWithName = await profileRepository.findByUserIdAndName(userId, name.trim());
    if (existingWithName) {
        return { error: "A profile with this name already exists", status: 409 };
    }

    const isDefault = existingProfiles.length === 0;

    const profile = await profileRepository.create({
        userId,
        name: name.trim(),
        encryptedData,
        iv,
        isDefault,
    });

    return { profile };
};

export const getProfiles = async (userId) => {
    const profiles = await profileRepository.findByUserId(userId);
    return { profiles };
};

export const getProfile = async (userId, profileId) => {
    const profile = await profileRepository.findById(profileId);

    if (!profile) {
        return { error: "Profile not found", status: 404 };
    }

    if (profile.userId.toString() !== userId) {
        return { error: "Access denied", status: 403 };
    }

    return { profile };
};

export const updateProfile = async (userId, profileId, { name, encryptedData, iv }) => {
    const profile = await profileRepository.findById(profileId);

    if (!profile) {
        return { error: "Profile not found", status: 404 };
    }

    if (profile.userId.toString() !== userId) {
        return { error: "Access denied", status: 403 };
    }

    if (name && name.trim() !== profile.name) {
        const existingWithName = await profileRepository.findByUserIdAndName(userId, name.trim());
        if (existingWithName && existingWithName._id.toString() !== profileId) {
            return { error: "A profile with this name already exists", status: 409 };
        }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (encryptedData) updates.encryptedData = encryptedData;
    if (iv) updates.iv = iv;

    const updatedProfile = await profileRepository.findByIdAndUpdate(profileId, updates);

    return { profile: updatedProfile };
};

export const deleteProfile = async (userId, profileId) => {
    const profile = await profileRepository.findById(profileId);

    if (!profile) {
        return { error: "Profile not found", status: 404 };
    }

    if (profile.userId.toString() !== userId) {
        return { error: "Access denied", status: 403 };
    }

    const wasDefault = profile.isDefault;
    await profileRepository.deleteOne({ _id: profileId });

    if (wasDefault) {
        const remainingProfiles = await profileRepository.findByUserId(userId);
        if (remainingProfiles.length > 0) {
            await profileRepository.findByIdAndUpdate(remainingProfiles[0]._id, {
                isDefault: true,
            });
        }
    }

    return { success: true };
};

export const setDefaultProfile = async (userId, profileId) => {
    const profile = await profileRepository.findById(profileId);

    if (!profile) {
        return { error: "Profile not found", status: 404 };
    }

    if (profile.userId.toString() !== userId) {
        return { error: "Access denied", status: 403 };
    }

    await profileRepository.setDefaultProfile(userId, profileId);

    return { success: true };
};

export const syncProfiles = async (userId, profiles) => {
    if (!Array.isArray(profiles)) {
        return { error: "Profiles must be an array", status: 400 };
    }

    if (profiles.length > MAX_PROFILES_PER_USER) {
        return {
            error: `Maximum of ${MAX_PROFILES_PER_USER} profiles allowed`,
            status: 400,
        };
    }

    for (const p of profiles) {
        if (!p.name || !p.encryptedData || !p.iv) {
            return { error: "Each profile must have name, encryptedData, and iv", status: 400 };
        }
    }

    await profileRepository.deleteAllByUserId(userId);

    const createdProfiles = [];
    for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];
        const profile = await profileRepository.create({
            userId,
            name: p.name.trim(),
            encryptedData: p.encryptedData,
            iv: p.iv,
            isDefault: i === 0,
        });
        createdProfiles.push(profile);
    }

    return { profiles: createdProfiles };
};

export default {
    createProfile,
    getProfiles,
    getProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
    syncProfiles,
};
