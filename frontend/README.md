Frontend scaffold (Next.js + TypeScript)

Quick start:

1. cd frontend
2. npm install
3. npm run dev

Notes:
- This scaffold includes layouts, auth handling (localStorage token), an Axios client, and a dashboard page that calls `/api/dashboard/stats`.
- API calls to `/api/*` are proxied to `BACKEND_URL` from `next.config.js`; by default this is `http://localhost:4000`.
- Tailwind is configured; run `npx tailwindcss -i ./styles/globals.css -o ./public/tailwind.css --watch` if needed, but Next dev handles it.
# Frontend

Next.js frontend for Cyberify AI Meeting Assistant.

Start:

```
cd frontend
npm install
npm run dev
```
