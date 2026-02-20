# Autofill.Ai – Backend

Node.js API used by the [Autofill.Ai extension](../autofill-extention) to generate form-fill values. Accepts field definitions and page context, calls an AI provider (DeepSeek), and returns a JSON object of field keys to suggested values.

## Features

- **POST /analyze-form** – Receives form fields, context, page URL/title, and options; returns AI-generated values keyed by field `key`.
- **Fill only empty** – When `fillOnlyEmpty` is true, the prompt instructs the model to return only keys for fields that are currently empty.
- **Richer context** – Uses page URL, page title, and form purpose in the prompt so responses are context-aware (e.g. job forms get job-appropriate text).
- **GET /health** – Simple health check for the extension to verify the server is reachable.

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

| Variable             | Required | Description                                      |
|----------------------|----------|--------------------------------------------------|
| `DEEPSEEK_API_KEY`   | Yes      | Your DeepSeek API key.                           |
| `PORT`               | No       | Server port. Default: `3000`. Use `9000` to match the extension default. |

Example `.env`:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=9000
```

The extension’s default backend URL is `http://localhost:9000`; set `PORT=9000` (or configure the extension to point to your host/port).

## Running

**Development (with file watch):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server listens on `http://localhost:<PORT>`. You should see: `Backend running on http://localhost:9000` (or your chosen port).

## API

### GET /health

- **Response:** `200` with `{ "ok": true }`.
- Used by the extension to detect if the backend is reachable.

### POST /analyze-form

- **Request body (JSON):**
  - `fields` (required) – Array of field objects with at least `key`, and optionally `label`, `type`, `options`, `currentValue`, etc.
  - `context` (optional) – Form title or purpose (e.g. “Job Application”).
  - `pageUrl` (optional) – Current page URL.
  - `pageTitle` (optional) – Document title.
  - `fillOnlyEmpty` (optional) – If `true`, the model is instructed to return only keys for fields that are empty (no `currentValue` or empty string).

- **Response:** `200` with a JSON object mapping field `key` to suggested value (string or number as appropriate).

- **Errors:**
  - `400` – Missing or invalid `fields`.
  - `500` – AI or parsing error (e.g. invalid JSON from the model).

## Project structure

```
autofill-be/
├── index.js      # Express app, /health, /analyze-form, DeepSeek client
├── package.json
├── .env          # Not committed; copy from .env.example
├── .gitignore
└── README.md
```

## Adding a privacy/API policy page

To link from the extension’s privacy notice, you can add a route (e.g. `/privacy`) that serves a static page or HTML describing how form data and context are used and that no data is stored by you beyond the AI request. Then set `PRIVACY_POLICY_URL` in the extension to `http://localhost:9000/privacy` (or your deployed URL).

## License

ISC (or as specified in the project).
