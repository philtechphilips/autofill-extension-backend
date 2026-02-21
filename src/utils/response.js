export const success = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
    });
};

export const error = (res, message, statusCode = 500, details = null) => {
    const response = {
        success: false,
        error: message,
    };
    if (details) {
        response.details = details;
    }
    return res.status(statusCode).json(response);
};

export const created = (res, data) => success(res, data, 201);

export const badRequest = (res, message, details = null) => error(res, message, 400, details);

export const unauthorized = (res, message = "Unauthorized") => error(res, message, 401);

export const forbidden = (res, message = "Forbidden") => error(res, message, 403);

export const notFound = (res, message = "Not found") => error(res, message, 404);
