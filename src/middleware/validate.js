import { badRequest } from "../utils/response.js";

export const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map((d) => d.message);
            return badRequest(res, "Validation failed", details);
        }

        req.body = value;
        next();
    };
};

export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            convert: true,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map((d) => d.message);
            return badRequest(res, "Validation failed", details);
        }

        // Express v5 makes req.query a read-only getter — mutate in place instead
        Object.keys(req.query).forEach((k) => delete req.query[k]);
        Object.assign(req.query, value);
        next();
    };
};
