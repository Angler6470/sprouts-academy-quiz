# Sprouts Academy Quiz Builder

Sprouts Academy Quiz Builder is a React app for parents, homeschool families, tutors, and teachers who need printable practice worksheets fast. It uses the OpenAI Responses API to generate age-appropriate quiz questions, answer keys, and short explanations.

## What the app does

- Generates Math, Reading, and Science quizzes by grade band, topic, difficulty, and question type.
- Supports printable student worksheets and printable answer keys.
- Stores recent quizzes in local storage with rename and delete controls.
- Supports lightweight in-browser editing before printing.
- Includes installable PWA shell support for quick launch, while still requiring internet for new AI generations.

## Project structure

- `src/`: React client.
- `functions/api/generate-quiz.js`: serverless production endpoint.
- `server/server.js`: local development API server.
- `shared/`: shared validation, prompt, schema, and response parsing used by both backends.

## Local development

1. Install dependencies in the root and server folders.
2. Start the local API server:

```bash
npm run dev:server
```

3. In a second terminal, start Vite:

```bash
npm run dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3001`.

### Local license key

The development server seeds one local key automatically:

- License key: `sprouts-local-dev`
- Default credits: `500`

You can override those values with `DEV_LICENSE_KEY` and `DEV_LICENSE_CREDITS` in `server/.env`.

## Environment

### Serverless function

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `LICENSES` KV binding

### Local Express server

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `DEV_LICENSE_KEY` (optional)
- `DEV_LICENSE_CREDITS` (optional)

## Quality checks

```bash
npm run lint
npm run build
```

## Product notes

- The app is installable, but not offline-first.
- Saved quizzes remain available in the browser even when the network is unavailable.
- New AI generation still requires network access.
