Trinka ai editor with mock AI API
===================================

- Start mock API only: `npm run mock-api`
- Start editor dev only: `npm run dev`
- Or run both together: `npm run start:mock`

Mock API endpoints (served by the local Express mock):

- `GET  /api/v1/health`
- `POST /api/v1/ai/respond` with body `{ "message": "...", "session": { ...optional... } }`

The mock responder is tuned for writers:

- Researchers get guidance on clarity for reviewers, hedging, and structure.
- Students get help staying on‑prompt and making answers more formal.
- Other writers get suggestions on openings, pacing, and trimming fluff.

For local/dev usage, point the frontend to the mock base URL with a Vite env var,
for example in your local `.env` file:

`VITE_TRINKA_API_URL=http://localhost:5005/api/v1`


