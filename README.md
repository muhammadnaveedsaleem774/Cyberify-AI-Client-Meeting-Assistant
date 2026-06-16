# Cyberify AI Client Meeting Assistant

Cyberify AI Client Meeting Assistant is a multi-tenant SaaS platform for agencies and software houses to manage client projects, meeting notes, AI-generated requirement analysis, task follow-up, file attachments, activity logs, PDF reports, and real-time workspace notifications without leaking data across tenants.

## Features

- Workspace-based multi-tenancy for projects, meetings, tasks, files, AI analyses, and activity logs.
- JWT authentication with access tokens, refresh token rotation, logout, and protected routes.
- Project, meeting, and task CRUD with search and filtering.
- AI meeting analysis with Groq, OpenAI, Gemini, or mock fallback when no key is configured.
- AI-generated requirements, user roles, database entities, timeline, tasks, and risks.
- Authenticated file upload/download/delete for PDF, DOCX, and TXT files.
- Dashboard metrics, charts, activity timeline, PDF export, and SSE notifications.
- Admin stats endpoint protected by `requireAdmin`.
- Docker Compose setup for frontend, backend, and MongoDB.

## Prerequisites

- Node.js 18+ recommended.
- npm.
- MongoDB running locally, or Docker for the containerized setup.
- Optional: one AI API key for real AI analysis (`GROQ_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`).

Works without an AI API key — set `GROQ_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` for real AI analysis.

## Setup

Clone the repository and install dependencies:

```powershell
git clone <repository-url>
cd Cyberify-AI-Client-Meeting-Assistant
npm install
```

Create environment files:

```powershell
copy backend\.env.example backend\.env
copy .env.example .env
```

Update `backend\.env` with local values. Use placeholders for secrets in examples and real secrets only in local/private environment files.

Minimum backend configuration:

```env
PORT=4000
DATABASE_URL=mongodb://localhost:27017/cyberify
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

Run the backend:

```powershell
cd backend
npm run dev
```

Run the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend proxies `/api/*` requests to the backend through `frontend/next.config.js`.

## Root Scripts

```powershell
npm install
npm run build
```

The root `dev` script uses a Unix-style background operator, so on Windows it is usually clearer to run backend and frontend in separate terminals as shown above.

## Tests

Run backend tests:

```powershell
npm --prefix backend test
```

Run TypeScript checks:

```powershell
npx tsc -p backend\tsconfig.json --noEmit
npx tsc -p frontend\tsconfig.json --noEmit
```

## Docker

Create a root `.env` file from `.env.example`, then run:

```powershell
docker-compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- MongoDB: `localhost:27017`

Uploaded files are stored in the `backend-uploads` Docker volume. MongoDB data is stored in the `mongo-data` volume.

## Admin User Creation

To create an admin user, update a user document's `role` field to `'admin'` directly in MongoDB.

Example MongoDB update:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
);
```

## AI Configuration

Provider priority is:

1. Groq
2. OpenAI
3. Gemini
4. Mock fallback

Real AI analysis is enabled by setting one of:

```env
GROQ_API_KEY=your-groq-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

If no provider key is configured, the backend logs a warning and uses a mock analysis provider so demos continue to work.

## API Overview

Base URL:

```text
http://localhost:4000/api
```

Auth:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Workspace and dashboard:

- `GET /workspaces`
- `GET /dashboard/stats`
- `GET /dashboard/report`

Projects:

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`

Meetings:

- `GET /meetings`
- `POST /meetings`
- `GET /meetings/:id`
- `PUT /meetings/:id`
- `DELETE /meetings/:id`

Tasks:

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `PATCH /tasks/:id/complete`
- `DELETE /tasks/:id`

AI:

- `POST /ai/analyze-notes`
- `POST /ai/confirm-analysis`
- `POST /ai/analyze-meeting`
- `GET /ai/analysis/:meetingId`
- `DELETE /ai/analysis/:meetingId`

Files:

- `POST /files/upload`
- `GET /files/project/:projectId`
- `GET /files/:id/download`
- `DELETE /files/:id`

Other:

- `GET /activity-logs`
- `GET /notifications/subscribe`
- `GET /export/pdf/:workspaceId`
- `GET /admin/stats`

## Postman

Postman files are available at:

```text
docs/postman/Cyberify-AI-Meeting-Assistant.postman_collection.json
docs/postman/Cyberify-local.postman_environment.json
```

Recommended flow:

1. Import the collection and environment.
2. Run signup to populate `accessToken` and `refreshToken`.
3. Create a project.
4. Create a meeting.
5. Run AI analysis.
6. Review generated requirements, tasks, risks, dashboard stats, activity logs, files, and notifications.

## Documentation

- Requirements: `docs/Requirement.md`
- Architecture: `docs/architecture.md`
- Postman collection: `docs/postman/Cyberify-AI-Meeting-Assistant.postman_collection.json`
