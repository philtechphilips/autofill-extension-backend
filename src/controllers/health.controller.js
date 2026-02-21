import { success } from "../utils/response.js";

export const healthCheck = (req, res) => {
  success(res, { ok: true, timestamp: new Date().toISOString() });
};
