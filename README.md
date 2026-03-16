# Feedback Tracker

An AI-powered product feedback tracker. Submit feedback, and Gemini automatically classifies sentiment, assigns a category, and generates a one-line action summary.

## Stack

| Layer     | Tech                            |
|-----------|---------------------------------|
| API       | Express + Sequelize + SQLite    |
| AI        | Google Gemini 2.5 Flash         |
| Frontend  | React + Vite + Tailwind CSS     |

---

## Project structure

```
feedback-tracker/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Sequelize + SQLite setup
│   │   ├── models/Feedback.js    # Feedback model
│   │   ├── routes/feedback.js    # CRUD route handlers
│   │   ├── services/gemini.js    # AI enrichment service
│   │   └── app.js               # Express entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/client.js         # Axios API client
    │   ├── components/
    │   │   ├── FeedbackForm.jsx  # Submit form
    │   │   ├── FeedbackCard.jsx  # Single item w/ AI fields + controls
    │   │   └── FeedbackList.jsx  # List + loading skeleton
    │   ├── App.jsx               # Root with state, filter tabs, stats
    │   └── main.jsx
    └── package.json
```

---

## Setup

### 1. Get a Gemini API key

Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
npm install
```

### 3. Configure the frontend

```bash
cd frontend
# Optional: create .env.local if your API runs on a different port
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm install
```

### 4. Run both servers

Terminal 1 - API:
```bash
cd backend
npm run dev
# -> API listening on http://localhost:3001
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# -> http://localhost:5173
```

---

## API reference

| Method   | Endpoint           | Body / Params             | Description                        |
|----------|--------------------|---------------------------|------------------------------------|
| `POST`   | `/feedback`        | `{ text: string }`        | Create item + run AI enrichment    |
| `GET`    | `/feedback`        | -                         | List all items, newest first       |
| `PATCH`  | `/feedback/:id`    | `{ status: string }`      | Update status                      |
| `DELETE` | `/feedback/:id`    | -                         | Remove item                        |
| `GET`    | `/health`          | -                         | Health check                       |

### Feedback item shape

```json
{
  "id": "uuid",
  "text": "The dashboard takes forever to load on mobile.",
  "status": "open | in-progress | resolved",
  "sentiment": "positive | negative | neutral | null",
  "category": "feature | UX | performance | bug | other | null",
  "action_summary": "Investigate and optimise dashboard load time for mobile users. | null",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:02.000Z"
}
```

`sentiment`, `category`, and `action_summary` are `null` if Gemini enrichment failed (graceful degradation).

---

## AI enrichment

Triggered automatically on `POST /feedback`. The flow:

1. Feedback text is saved to SQLite with null AI fields.
2. Gemini 1.5 Flash is called with a strict JSON-only prompt.
3. Response is validated and parsed.
4. Item is updated with `{ sentiment, category, action_summary }`.
5. Fully enriched item is returned (adds around 1-2s to response time).

If Gemini fails (rate limit, invalid key, non-JSON response), the item is returned with null AI fields. The frontend renders a subtle "AI enrichment unavailable" state in that case.

---

## Frontend features

- Submit form - textarea with character counter (max 2000), loading state during AI call.
- Filter tabs - filter by all / open / in-progress / resolved with counts.
- Stats bar - total count, in-progress count, resolved count.
- Feedback cards - sentiment pill (color-coded), category pill, action summary in italic quote style.
- Status toggle - click to cycle open -> in-progress -> resolved with optimistic update.
- Delete button - appears on hover, animates card out on delete.
- Loading skeletons - pulsing placeholders on first load.
- Error states - form-level and global API error handling.

---

## Extending

Add more categories: Update the `PROMPT_TEMPLATE` in `gemini.js` and add the new value to the `validCategories` array. No schema migration needed (category is a STRING column, not an ENUM).

Switch to PostgreSQL: Replace `sqlite3` with `pg` and update `dialect: 'sqlite'` to `dialect: 'postgres'` and `storage` to `host/port/database/username/password` in `config/db.js`.

Retry failed enrichment: Add a cron job that queries `WHERE sentiment IS NULL` and re-runs `enrichFeedback` on those items.

Add pagination: Pass `?page=1&limit=20` query params to `GET /feedback` and use Sequelize's `limit` and `offset` options.
