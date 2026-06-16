# Architecture

## Overview

Cyberify AI Client Meeting Assistant is a multi-tenant SaaS application for agencies and software houses that need to turn client meeting notes into structured requirements, tasks, risks, and reports. The frontend is a Next.js dashboard, while the backend is an Express API that owns authentication, tenant isolation, validation, AI orchestration, file metadata, and real-time notifications. MongoDB stores all workspace-scoped product data, and AI providers are called only from the backend.

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js, React, TypeScript | Dashboard UI, protected pages, client-side workflows |
| Styling | Tailwind CSS | Responsive layout, dark mode, reusable UI primitives |
| API Client | Axios | Authenticated API calls with token refresh retry |
| Charts | Recharts | Dashboard metrics and workspace reporting visuals |
| Backend | Node.js, Express, TypeScript | REST API, middleware, validation, business logic |
| Database | MongoDB, Mongoose | Persistent workspace, user, project, meeting, task, file, AI, and activity data |
| Auth | JWT access token + refresh token rotation | Secure protected routes and session continuation |
| AI | Groq, OpenAI, Gemini, mock fallback | Meeting analysis, task generation, and risk extraction |
| Real Time | Server-Sent Events | Workspace notifications for task and meeting events |
| Files | Multer, local disk, optional S3 | Upload, download, delete, and metadata tracking |
| Reports | PDFKit | Workspace PDF export |
| Testing | Jest, Supertest, mongodb-memory-server | Backend API, auth, AI, validation, and tenant isolation tests |
| Deployment | Docker, Docker Compose | Full-stack local or containerized runtime |

## System Architecture

### Frontend

The frontend is a Next.js application with pages for authentication, dashboard, projects, meetings, tasks, files, activity logs, notifications, and admin stats. It calls `/api/*` routes through Next.js rewrites, and the shared Axios client attaches the JWT access token and refreshes it when a protected request returns `401`.

### Backend

The backend is a modular Express API. Route modules live under `backend/src/modules`, business logic lives under `backend/src/services`, MongoDB schemas live under `backend/src/models`, and middleware handles auth, validation, admin access, and error responses.

### Data + AI

MongoDB stores all application data through Mongoose models. AI analysis runs server-side: meeting notes are loaded by `meetingId` and `workspaceId`, converted into a strict JSON prompt, sent to Groq/OpenAI/Gemini when configured, validated and normalized, then stored as an `AIAnalysis` document. If no AI API key is configured, the mock provider returns realistic demo analysis so the app still works.

## Backend Module Structure

| Module | Description |
| --- | --- |
| `activity` | Legacy/activity route surface for workspace event tracking. |
| `activityLogs` | Activity log API for listing workspace timeline events. |
| `admin` | System-wide admin statistics protected by `requireAuth` and `requireAdmin`. |
| `ai` | AI analysis, saved analysis lookup, deletion, and confirm-analysis workflow. |
| `auth` | Signup, login, refresh token rotation, logout, and current-user lookup. |
| `dashboard` | Workspace dashboard metrics and PDF report route. |
| `export` | Workspace PDF export with optional date filters. |
| `files` | File upload, project file listing, authenticated download, and delete. |
| `meetings` | Workspace-scoped meeting CRUD and search/filter support. |
| `notifications` | SSE subscription endpoint for real-time workspace events. |
| `projects` | Workspace-scoped project CRUD and search/filter support. |
| `tasks` | Workspace-scoped task CRUD, filters, completion, assignment email trigger. |
| `workspace` | Workspace listing, invitations, and join flow. |

## AI Pipeline

1. User enters or saves meeting notes.
2. Backend loads the meeting using both `meetingId` and `workspaceId`.
3. Prompt engineering builds a strict JSON instruction set for requirements, roles, entities, timeline, tasks, and risks.
4. Provider selection uses Groq first, then OpenAI, then Gemini, based on configured API keys.
5. If no AI key exists, the mock fallback simulates provider latency and returns realistic demo data.
6. Provider output is parsed as JSON, retried once if malformed, validated, and normalized.
7. Backend stores the result as an `AIAnalysis` document scoped to the workspace.
8. In the confirm workflow, the user reviews the analysis, saves the meeting/project context, and generated task suggestions become real `Task` documents.

## Database Collections

| Collection | Purpose |
| --- | --- |
| `users` | User accounts, password hashes, global role, and workspace role references. |
| `workspaces` | Tenant containers with owner, members, and settings. |
| `workspaceinvitations` | Workspace invite tokens, target email, role, expiry, and acceptance state. |
| `refreshtokens` | Hashed refresh tokens, expiry, revocation, and rotation metadata. |
| `projects` | Workspace-scoped client projects with status and client metadata. |
| `meetings` | Workspace-scoped meeting notes, date, and optional project link. |
| `tasks` | Workspace-scoped actionable tasks linked to projects or meetings. |
| `files` | Uploaded file metadata, storage provider, path/key, project link, and uploader. |
| `aianalyses` | Structured AI output, generated task suggestions, risks, and normalized fields. |
| `activities` | Workspace activity timeline events with entity metadata. |

## Authentication Flow

Users sign up or log in with email and password. The backend returns a short-lived JWT access token, configured for 15 minutes, and a long-lived refresh token, configured for 7 days. Refresh tokens are JWTs with unique token IDs, stored in MongoDB as SHA-256 hashes. On refresh, the backend verifies the old token, revokes it, creates a new refresh token, and returns a new access token. Logout revokes the active refresh token.

## Multi-Tenant Design

Every normal user-facing data query is scoped by the workspace identifier (`workspace_id` conceptually, implemented as `workspaceId` in the codebase). Protected routes derive `workspaceId` from the verified access token instead of trusting client-provided workspace IDs. Workspace-scoped collections include projects, meetings, tasks, files, AI analyses, and activities. Relationship writes validate that referenced `projectId` and `meetingId` belong to the current workspace before creating or updating linked records.

Examples:

```ts
ProjectModel.findOne({ _id: projectId, workspaceId });
MeetingModel.find({ workspaceId });
TaskModel.findOneAndUpdate({ _id: taskId, workspaceId }, updates);
AIAnalysisModel.findOne({ meetingId, workspaceId });
```

Admin routes are intentionally system-wide and require a user with `role: "admin"`.

## Real-Time Notifications

The backend exposes an SSE endpoint at `GET /api/notifications/subscribe`. Authenticated clients subscribe with an access token, and the notification service keeps an in-memory list of connected clients by workspace and user. Events are sent for actions such as task creation, task completion, and meeting creation. A small in-memory event history allows missed events to replay when the client reconnects with the last event ID.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Backend HTTP port. |
| `DATABASE_URL` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret used to sign access and refresh JWTs. |
| `ACCESS_TOKEN_EXPIRES_IN` | Yes | Access token lifetime, normally `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh token lifetime, normally `7d`. |
| `FRONTEND_URL` | Optional | Frontend origin for deployment configuration. |
| `APP_NAME` | Optional | Application name used in emails and messages. |
| `GROQ_API_KEY` | Optional | Groq API key for real AI analysis. |
| `GROQ_MODEL` | Optional | Groq model name. |
| `GROQ_BASE_URL` | Optional | Groq-compatible API base URL. |
| `OPENAI_API_KEY` | Optional | OpenAI API key for real AI analysis. |
| `OPENAI_MODEL` | Optional | OpenAI model name. |
| `OPENAI_BASE_URL` | Optional | OpenAI-compatible API base URL. |
| `GEMINI_API_KEY` | Optional | Gemini API key for real AI analysis. |
| `GEMINI_MODEL` | Optional | Gemini model name. |
| `GEMINI_BASE_URL` | Optional | Gemini API base URL. |
| `AWS_REGION` | Optional | AWS region for S3 file storage. |
| `AWS_ACCESS_KEY_ID` | Optional | AWS access key ID for S3. Use a placeholder in examples. |
| `AWS_SECRET_ACCESS_KEY` | Optional | AWS secret access key for S3. Use a placeholder in examples. |
| `AWS_SESSION_TOKEN` | Optional | Temporary AWS session token when using temporary credentials. |
| `S3_BUCKET_NAME` | Optional | S3 bucket name for uploaded files. |
| `S3_FORCE_PATH_STYLE` | Optional | Set to `true` for S3-compatible local/object storage providers. |
| `S3_PUBLIC_BASE_URL` | Optional | Public base URL for S3-compatible storage, if needed. |
| `SMTP_HOST` | Optional | SMTP host for task assignment emails. |
| `SMTP_PORT` | Optional | SMTP port. |
| `SMTP_SECURE` | Optional | Whether SMTP should use TLS. |
| `SMTP_USER` | Optional | SMTP username. |
| `SMTP_PASS` | Optional | SMTP password. |
| `MAIL_FROM` | Optional | Sender address for outbound emails. |
| `SENDGRID_API_KEY` | Optional | SendGrid SMTP shortcut. |
| `BACKEND_URL` | Required for frontend container | Backend URL used by Next.js rewrites in Docker/deployment. |
| `NEXT_PUBLIC_API_BASE` | Optional for browser | Browser-visible API base when not relying on Next.js rewrites. |
