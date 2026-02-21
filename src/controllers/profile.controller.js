import profileService from "../services/profile.service.js";
import { success, created, error, unauthorized } from "../utils/response.js";

export const createProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { name, encryptedData, iv } = req.body;
        const result = await profileService.createProfile(req.user.id, {
            name,
            encryptedData,
            iv,
        });

        if (result.error) {
            return error(res, result.error, result.status);
        }

        created(res, { profile: result.profile });
    } catch (err) {
        next(err);
    }
};

export const getProfiles = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const result = await profileService.getProfiles(req.user.id);
        success(res, { profiles: result.profiles });
    } catch (err) {
        next(err);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { id } = req.params;
        const result = await profileService.getProfile(req.user.id, id);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { profile: result.profile });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { id } = req.params;
        const { name, encryptedData, iv } = req.body;
        const result = await profileService.updateProfile(req.user.id, id, {
            name,
            encryptedData,
            iv,
        });

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { profile: result.profile });
    } catch (err) {
        next(err);
    }
};

export const deleteProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { id } = req.params;
        const result = await profileService.deleteProfile(req.user.id, id);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { message: "Profile deleted successfully" });
    } catch (err) {
        next(err);
    }
};

export const setDefaultProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { id } = req.params;
        const result = await profileService.setDefaultProfile(req.user.id, id);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { message: "Default profile updated" });
    } catch (err) {
        next(err);
    }
};

export const syncProfiles = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { profiles } = req.body;
        const result = await profileService.syncProfiles(req.user.id, profiles);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { profiles: result.profiles, message: "Profiles synced successfully" });
    } catch (err) {
        next(err);
    }
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
