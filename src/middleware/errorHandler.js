import config from "../config/index.js";

export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`, err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(config.env === "development" && { stack: err.stack }),
    });
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`,
    });
};
