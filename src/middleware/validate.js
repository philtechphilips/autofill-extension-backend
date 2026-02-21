import { badRequest } from "../utils/response.js";

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

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
    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const details = error.details.map((d) => d.message);
      return badRequest(res, "Validation failed", details);
    }

    req.query = value;
    next();
  };
};
