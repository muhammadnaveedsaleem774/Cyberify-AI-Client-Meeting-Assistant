# Cyberify AI Client Meeting Assistant

A multi-tenant SaaS platform for agencies and software houses to manage client projects, meeting notes, AI-generated requirement analysis, task follow-up, file attachments, activity logs, and real-time workspace notifications.

The product is designed around a common agency workflow: a client meeting happens, notes are captured, AI turns those notes into structured requirements and risks, tasks are generated, and the workspace team tracks execution without leaking data across tenants.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Axios, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JWT access tokens, refresh-token rotation, MongoDB token revocation |
| AI | Groq first, OpenAI fallback, Gemini fallback |
| Real time | Server-Sent Events |
| Testing | Jest, Supertest, mongodb-memory-server |
| Deployment | Docker, Docker Compose |

## Architecture

```text
Browser
  |
  | Next.js pages, protected dashboard layout, Axios interceptor
  v
Frontend container :3000
  |
  | /api/* proxy via Next rewrites
  v
Backend container :4000
  |
  | Express modules: auth, projects, meetings, tasks, AI, files, dashboard, admin
  v
MongoDB container :27017

AI Providers
  ^
  | Groq/OpenAI/Gemini API calls from backend only
```

The frontend never talks directly to MongoDB or AI providers. It calls `/api/*`, which is proxied to the Express API. The backend owns authentication, tenant isolation, validation, persistence, file metadata, AI orchestration, and SSE notification streams.

## Core Features

- Signup, login, logout, token refresh, and protected routes.
- Refresh tokens stored as hashes in MongoDB and rotated on refresh.
- Workspace-based multi-tenancy for projects, meetings, tasks, files, activities, and AI analysis.
- Dashboard metrics and charts.
- Project, meeting, and task CRUD.
- Search and combinable filters for project status, task status, priority, and date ranges.
- AI meeting analysis with strict structured JSON output.
- AI-generated actionable tasks and requirement risks.
- Project file upload/download/delete for PDF, DOCX, and TXT files.
- Activity log timeline.
- Admin system statistics.
- SSE live notifications for task creation, task completion, and meeting creation.
- Jest + Supertest backend test suite.
- Docker Compose full-stack setup.

## Monorepo Structure

```text
.
├── backend
│   ├── src
│   │   ├── modules       # Express route modules
│   │   ├── services      # Business logic
│   │   ├── models        # Mongoose models
│   │   ├── middleware    # Auth, validation, errors
│   │   └── providers/ai  # Groq/OpenAI/Gemini integrations
│   └── test/jest         # Production Jest API tests
├── frontend
│   ├── pages             # Next.js routes
│   ├── components        # Layout, forms, notification UI
│   ├── hooks             # SSE notification hook
│   └── lib               # API, auth, AI normalization helpers
├── docs
│   └── postman           # Postman collection and environment
└── docker-compose.yml
```

## Environment Variables

Copy the examples before running locally:

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

Backend variables:

```env
PORT=4000
DATABASE_URL=mongodb://localhost:27017/cyberify
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

Frontend variables:

```env
BACKEND_URL=http://localhost:4000
```

Only one AI key is required. Provider priority is Groq, then OpenAI, then Gemini.

## Local Setup

Install dependencies:

```powershell
npm install
```

Start MongoDB locally, then run the backend:

```powershell
cd backend
npm run dev
```

In another terminal, run the frontend:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend proxies `/api/*` to the backend through `frontend/next.config.js`.

## Docker Setup

Create a root `.env` file from `.env.example`, then run:

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- MongoDB: `localhost:27017`

Uploaded files are persisted in the `backend-uploads` Docker volume. MongoDB data is persisted in the `mongo-data` volume.

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

Projects:

- `GET /projects?q=&status=&dateFrom=&dateTo=`
- `POST /projects`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`

Meetings:

- `GET /meetings?q=&dateFrom=&dateTo=`
- `POST /meetings`
- `GET /meetings/:id`
- `PUT /meetings/:id`
- `DELETE /meetings/:id`

Tasks:

- `GET /tasks?q=&status=&priority=&dateFrom=&dateTo=`
- `POST /tasks`
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `PATCH /tasks/:id/complete`
- `DELETE /tasks/:id`

AI:

- `POST /ai/analyze-meeting`
- `GET /ai/analysis/:meetingId`
- `DELETE /ai/analysis/:meetingId`

Files:

- `POST /files/upload`
- `GET /files/project/:projectId`
- `GET /files/:id/download`
- `DELETE /files/:id`

Other:

- `GET /dashboard/stats`
- `GET /activity-logs`
- `GET /notifications/subscribe`
- `GET /workspaces`
- `GET /admin/stats`

The Postman collection is available at:

```text
docs/postman/Cyberify-AI-Meeting-Assistant.postman_collection.json
docs/postman/Cyberify-local.postman_environment.json
```

## AI Workflow

1. User creates a meeting with notes.
2. User calls `POST /api/ai/analyze-meeting` with `meetingId`.
3. Backend loads the meeting by `_id` and `workspaceId`.
4. Backend sends a strict JSON prompt to the configured AI provider.
5. AI output is parsed, validated, retried once if malformed, and normalized.
6. Backend stores an `AIAnalysis` record scoped to the workspace.
7. Functional requirements become generated task suggestions.
8. Risks and missing requirements are stored in the same analysis object.

Canonical AI output:

```json
{
  "summary": "string",
  "functionalRequirements": ["string"],
  "userRoles": ["string"],
  "entities": ["string"],
  "timeline": ["string"],
  "risks": ["string"]
}
```

The backend also preserves legacy `requirements` and `roles` fields for compatibility.

## Multi-Tenant Design

Every user belongs to a workspace. Protected routes derive `workspaceId` from the verified access token and never trust a client-provided workspace ID for user data access.

Workspace-scoped models include:

- Project
- Meeting
- Task
- File
- Activity
- AIAnalysis

Examples:

- `Project.findOne({ _id, workspaceId })`
- `Task.find({ workspaceId, status, priority })`
- `AIAnalysis.findOne({ meetingId, workspaceId })`

Admin routes are intentionally system-wide and protected by an admin role check.

## Authentication Design

- Access tokens are short-lived JWTs.
- Refresh tokens are long-lived JWTs with a unique token ID.
- Refresh token hashes are stored in MongoDB.
- Refresh calls rotate refresh tokens and revoke the previous token.
- Logout revokes the active refresh token.
- Frontend Axios interceptor retries failed requests after refreshing on `401`.

## Real-Time Notifications

The backend exposes an SSE stream:

```text
GET /api/notifications/subscribe
```

Events:

- `taskCreated`
- `taskCompleted`
- `meetingCreated`

The frontend `useNotifications` hook subscribes when the dashboard layout loads, reconnects with backoff, stores the last event ID, and displays topbar/toast notifications.

## Testing

Run backend tests:

```powershell
npm --prefix backend test
```

Current Jest coverage includes:

- Auth success/failure, invalid JWT, expired token, refresh rotation.
- Multi-tenant isolation.
- Projects, meetings, and tasks lifecycle.
- AI response structure and invalid AI response handling.
- Negative cases for empty payloads, invalid IDs, invalid filters, and large payloads.
- File uploads using OS temp files to avoid permission issues.

Run TypeScript checks:

```powershell
npx tsc -p backend\tsconfig.json --noEmit
npx tsc -p frontend\tsconfig.json --noEmit
```

## Submission Notes

Recommended evaluation flow:

1. Import the Postman collection and environment.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000`.
4. Create a workspace from signup.
5. Create a project and meeting.
6. Analyze meeting notes with AI.
7. Review generated tasks, risks, dashboard metrics, activity logs, and live notifications.
