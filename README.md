# Autofill.Ai – Backend

Node.js API used by the [Autofill.Ai extension](../autofill-extention) to generate form-fill values. Accepts field definitions and page context, calls an AI provider (DeepSeek), and returns a JSON object of field keys to suggested values.

## Features

- **POST /api/v1/form/analyze** – Receives form fields, context, page URL/title, and options; returns AI-generated values keyed by field `key`.
- **Fill only empty** – When `fillOnlyEmpty` is true, the prompt instructs the model to return only keys for fields that are currently empty.
- **Richer context** – Uses page URL, page title, and form purpose in the prompt so responses are context-aware (e.g. job forms get job-appropriate text).
- **GET /api/v1/health** – Simple health check for the extension to verify the server is reachable.
- **Auth routes** – Placeholder routes for user authentication (`/api/v1/auth/*`).
- **Swagger docs** – Interactive API documentation at `/api-docs`.

## Requirements

- **Node.js** (v18+ recommended)
- **DeepSeek API key** – The app uses the OpenAI-compatible API at `https://api.deepseek.com`.

## Installation

```bash
cd autofill-be
npm install
```

## Configuration

Create a `.env` file in the project root, e.g. by copying `.env.example` and filling in your key. `.env` is gitignored.

| Variable           | Required | Description                                                              |
|--------------------|----------|--------------------------------------------------------------------------|
| `NODE_ENV`         | No       | Environment (`development` or `production`). Default: `development`.     |
| `PORT`             | No       | Server port. Default: `3000`. Use `9000` to match the extension default. |
| `DEEPSEEK_API_KEY` | Yes      | Your DeepSeek API key.                                                   |
| `AI_BASE_URL`      | No       | AI provider base URL. Default: `https://api.deepseek.com`.               |
| `AI_MODEL`         | No       | AI model to use. Default: `deepseek-chat`.                               |
| `JWT_SECRET`       | Yes*     | Secret for JWT signing (*required when auth is implemented).             |
| `JWT_EXPIRES_IN`   | No       | JWT expiration time. Default: `7d`.                                      |
| `CORS_ORIGIN`      | No       | Allowed CORS origin. Default: `*` (all origins).                         |

Example `.env`:

```env
NODE_ENV=development
PORT=9000
DEEPSEEK_API_KEY=your_deepseek_api_key_here
JWT_SECRET=your-super-secret-key
```

The extension's default backend URL is `http://localhost:9000`; set `PORT=9000` (or configure the extension to point to your host/port).

## Running

**Development (with file watch):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server listens on `http://localhost:<PORT>`. You should see: `[Server] Running on http://localhost:9000` (or your chosen port).

## API

All routes are prefixed with `/api/v1`. Legacy routes (`/health`, `/analyze-form`, `/api/*`) redirect to v1 endpoints for backward compatibility.

### Swagger Documentation

- **Swagger UI:** `http://localhost:9000/api-docs` – Interactive API documentation
- **OpenAPI JSON:** `http://localhost:9000/api-docs.json` – Raw OpenAPI spec

### GET /api/v1/health

- **Response:** `200` with `{ "success": true, "data": { "ok": true, "timestamp": "..." } }`.
- Used by the extension to detect if the backend is reachable.

### POST /api/v1/form/analyze

- **Request body (JSON):**
  - `fields` (required) – Array of field objects with at least `key`, and optionally `label`, `type`, `options`, `currentValue`, etc.
  - `context` (optional) – Form title or purpose (e.g. "Job Application").
  - `pageUrl` (optional) – Current page URL.
  - `pageTitle` (optional) – Document title.
  - `fillOnlyEmpty` (optional) – If `true`, the model is instructed to return only keys for fields that are empty (no `currentValue` or empty string).

- **Response:** `200` with `{ "success": true, "data": { ... } }` mapping field `key` to suggested value.

- **Errors:**
  - `400` – Missing or invalid `fields`.
  - `500` – AI or parsing error (e.g. invalid JSON from the model).

### Auth Routes (Placeholder)

- `POST /api/v1/auth/register` – User registration
- `POST /api/v1/auth/login` – User login
- `POST /api/v1/auth/logout` – User logout
- `POST /api/v1/auth/refresh` – Refresh JWT token
- `GET /api/v1/auth/me` – Get current user

## Project Structure

```
autofill-be/
├── src/
│   ├── config/
│   │   ├── index.js              # Centralized configuration
│   │   └── swagger.js            # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   ├── form.controller.js    # Form analysis handler
│   │   └── health.controller.js  # Health check handler
│   ├── middleware/
│   │   ├── auth.js               # Authentication middleware
│   │   ├── errorHandler.js       # Global error handling
│   │   └── validate.js           # Request validation
│   ├── routes/
│   │   ├── auth.routes.js        # Auth route definitions
│   │   ├── form.routes.js        # Form route definitions
│   │   ├── health.routes.js      # Health route definitions
│   │   └── index.js              # Route aggregator
│   ├── services/
│   │   └── ai.service.js         # AI/DeepSeek integration
│   ├── utils/
│   │   ├── parser.js             # Response parsing utilities
│   │   └── response.js           # Standardized response helpers
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── package.json
├── .env                          # Not committed; copy from .env.example
├── .env.example
├── .gitignore
└── README.md
```

## Adding Authentication

The codebase is structured to easily add authentication:

1. Install dependencies: `npm install jsonwebtoken bcryptjs`
2. Create `src/services/auth.service.js` with registration/login logic
3. Create `src/controllers/auth.controller.js` with route handlers
4. Update `src/routes/auth.routes.js` to use the new controller
5. Add database integration (MongoDB, PostgreSQL, etc.)

## License

ISC (or as specified in the project).
