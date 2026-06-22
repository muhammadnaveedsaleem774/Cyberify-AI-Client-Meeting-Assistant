# Cyberify AI Client Meeting Assistant - Project Report

## 1. Executive Summary

Cyberify AI Client Meeting Assistant is a multi-tenant SaaS platform designed for agencies and software houses that need to convert client meeting notes into structured project knowledge. The application helps teams capture meeting details, identify requirements, generate tasks, analyze risks, manage follow-ups, upload supporting files, track activity, and export reports.

The solution is implemented as a full-stack web application with a Next.js frontend, an Express and TypeScript backend, MongoDB persistence, JWT authentication with refresh token rotation, AI provider integration, Server-Sent Events notifications, and Docker support. The backend owns tenant isolation, validation, AI orchestration, file metadata, reporting, and business rules.

The project directly addresses the operational problem of messy meeting notes, unclear requirements, forgotten tasks, and delayed follow-ups. Its strongest technical focus is workspace-level data isolation: projects, meetings, tasks, files, activity logs, and AI analyses are scoped to a workspace and protected behind authenticated routes.

## 2. Project Purpose

The purpose of the platform is to support client-facing delivery teams by turning unstructured meeting notes into actionable project artifacts.

Key business goals:

- Reduce manual effort after client meetings.
- Improve requirement clarity and traceability.
- Convert meeting notes into project tasks.
- Detect missing requirements and delivery risks early.
- Keep client work separated across workspaces.
- Provide dashboards, logs, files, notifications, and reports for team visibility.

Target users:

- Software agencies.
- Product teams.
- Project managers.
- Business analysts.
- Delivery leads.
- Admin users who need system-level visibility.

## 3. Scope of Work

The application includes the following major modules:

| Area | Implementation |
| --- | --- |
| Authentication | Signup, login, logout, refresh token rotation, current-user lookup |
| Workspace SaaS | Workspace ownership, membership, invitations, join flow, tenant-scoped data |
| Dashboard | Project, meeting, task metrics, charts, reports |
| Projects | Workspace-scoped project CRUD with search and filters |
| Meetings | Workspace-scoped meeting CRUD, notes capture, project linking |
| AI Analysis | Meeting analysis, requirements, roles, entities, timeline, risks, task suggestions |
| Tasks | Task CRUD, priority, status, completion, assignment email trigger |
| Files | Upload, list, download, delete, project-linked metadata |
| Notifications | SSE subscription for workspace events |
| Activity Logs | Timeline records for important workspace actions |
| Admin Panel | System-wide statistics protected by admin role middleware |
| Export | PDF report generation |
| DevOps | Docker Compose setup for frontend, backend, and MongoDB |

## 4. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js, React, TypeScript | Dashboard UI and authenticated workflows |
| Styling | Tailwind CSS | Responsive styling and theme support |
| API Client | Axios | Authenticated HTTP calls and token refresh retry |
| Charts | Recharts | Dashboard metrics and reporting visuals |
| Backend | Node.js, Express, TypeScript | REST API, middleware, validation, business logic |
| Database | MongoDB, Mongoose | Persistent workspace and product data |
| Auth | JWT access token and refresh token rotation | Secure session management |
| AI Providers | Groq, OpenAI, Gemini, mock fallback | Structured meeting analysis |
| Real Time | Server-Sent Events | Workspace notifications |
| Files | Multer, local disk, optional S3 | Uploads and file metadata |
| Reports | PDFKit | PDF export |
| Testing | Jest, Supertest, mongodb-memory-server | Backend API and isolation tests |
| Deployment | Docker, Docker Compose | Containerized local/runtime setup |

## 5. System Architecture

The platform uses a separated frontend and backend architecture.

The frontend is a Next.js application responsible for pages, user interaction, protected dashboards, charts, and browser-side workflows. It communicates with the backend through `/api/*` routes, using a shared Axios client that attaches the access token and retries protected requests after token refresh when required.

The backend is an Express API written in TypeScript. It is organized into route modules, middleware, services, providers, models, and utilities. The backend is the trusted layer for authentication, authorization, tenant isolation, validation, AI provider calls, file handling, reports, and real-time notifications.

MongoDB stores users, workspaces, refresh tokens, projects, meetings, tasks, files, AI analyses, and activity logs. Mongoose models define the application data structure and support workspace-scoped queries.

High-level flow:

1. User authenticates through the frontend.
2. Backend issues an access token and refresh token.
3. Frontend sends API requests with the access token.
4. Backend derives the user's workspace from the verified token or workspace membership context.
5. Backend performs workspace-scoped queries and writes.
6. AI analysis, file operations, reports, and notifications are executed server-side.
7. MongoDB stores persistent application records.

## 6. Frontend Implementation

The frontend provides the main user interface for the platform. Current pages include:

- Landing/index page.
- Login and signup pages.
- Dashboard page.
- Projects list and project detail pages.
- Meetings list, detail, and edit pages.
- Tasks page.
- Activity logs page.
- Admin stats page.

Frontend responsibilities:

- Present authenticated dashboard workflows.
- Call backend APIs through Axios.
- Store and attach authentication tokens.
- Retry API calls after refresh when a protected request returns `401`.
- Render charts and metrics using Recharts.
- Support responsive layouts with Tailwind CSS.

The frontend is intentionally kept as a client application. It does not call AI providers directly and does not make tenant isolation decisions. Those responsibilities remain in the backend.

## 7. Backend Implementation

The backend follows a modular Express structure:

| Directory | Responsibility |
| --- | --- |
| `backend/src/modules` | Feature route modules |
| `backend/src/models` | Mongoose schemas and database models |
| `backend/src/services` | Business logic and reusable service functions |
| `backend/src/middleware` | Authentication, admin access, validation, error handling |
| `backend/src/providers` | AI provider integrations |
| `backend/src/utils` | Shared helpers, including PDF utilities |
| `backend/src/types` | Shared TypeScript types |

Implemented backend modules:

- `auth`
- `workspace`
- `dashboard`
- `projects`
- `meetings`
- `tasks`
- `ai`
- `files`
- `activity`
- `activityLogs`
- `notifications`
- `export`
- `admin`

The backend exposes a REST API under `/api`. Routes are protected where required and use middleware to verify JWTs, enforce admin access, validate input, and normalize errors.

## 8. Authentication and Authorization

The authentication system uses JWT access tokens and refresh tokens.

Authentication flow:

1. User signs up or logs in with email and password.
2. Backend validates credentials.
3. Backend returns a short-lived access token and a longer-lived refresh token.
4. Refresh tokens are stored in MongoDB as SHA-256 hashes.
5. On refresh, the old refresh token is verified, revoked, and replaced.
6. Logout revokes the active refresh token.

Security strengths:

- Passwords are hashed before storage.
- Access tokens are short-lived.
- Refresh tokens are rotated.
- Refresh tokens are stored as hashes, not plaintext.
- Protected routes require authentication.
- Admin routes require both authentication and admin role checks.

## 9. Multi-Tenant Data Isolation

Tenant isolation is a core design requirement. Workspace-scoped data must always be queried using `workspaceId`.

Workspace-scoped collections include:

- Projects.
- Meetings.
- Tasks.
- Files.
- AI analyses.
- Activity logs.

The backend derives workspace context from authenticated user data and route flow rather than trusting arbitrary workspace identifiers from the client. Related entity writes validate that referenced records belong to the same workspace before linking them.

Examples of required workspace-safe queries:

```ts
ProjectModel.findOne({ _id: projectId, workspaceId });
MeetingModel.find({ workspaceId });
TaskModel.findOneAndUpdate({ _id: taskId, workspaceId }, updates);
AIAnalysisModel.findOne({ meetingId, workspaceId });
```

This design reduces the risk of cross-tenant data leakage and supports SaaS-style separation between client workspaces.

## 10. Database Design

The application uses MongoDB with Mongoose. Main collections include:

| Collection | Purpose |
| --- | --- |
| `users` | User accounts, password hashes, roles, workspace references |
| `workspaces` | Tenant containers, owners, members, settings |
| `workspaceinvitations` | Invite tokens, roles, expiry, acceptance state |
| `refreshtokens` | Hashed refresh tokens, expiry, revocation state |
| `projects` | Client projects scoped by workspace |
| `meetings` | Meeting notes and optional project relationship |
| `tasks` | Action items linked to projects or meetings |
| `files` | Uploaded file metadata and storage location |
| `aianalyses` | Structured AI output and generated suggestions |
| `activities` | Workspace activity timeline events |

Important database design principle:

Every product record that belongs to a workspace must include `workspaceId` and must be queried with `workspaceId`.

## 11. AI Analysis Pipeline

The AI module is the central intelligent feature of the platform. It converts meeting notes into structured delivery artifacts.

AI output includes:

- Project summary.
- Functional requirements.
- User roles.
- Suggested database entities.
- Development timeline.
- Task suggestions.
- Risk and gap analysis.

Pipeline:

1. User enters or saves meeting notes.
2. Backend loads the meeting using both `meetingId` and `workspaceId`.
3. Backend builds a strict JSON prompt.
4. Provider selection checks configured keys in priority order: Groq, OpenAI, Gemini.
5. If no key is configured, mock fallback returns realistic demo data.
6. Provider response is parsed as JSON.
7. Malformed responses are retried once.
8. Output is validated and normalized.
9. Result is saved as an `AIAnalysis` document scoped to the workspace.
10. In the confirm workflow, generated task suggestions can become real `Task` documents.

This design keeps AI credentials private, prevents browser-side provider calls, and ensures AI results remain tenant-scoped.

## 12. Real-Time Notifications

The backend uses Server-Sent Events for real-time notifications.

Endpoint:

```text
GET /api/notifications/subscribe
```

Notification events include:

- Task created.
- Task completed.
- Meeting created.

The notification service stores active clients in memory by workspace and user. A small event history supports replay when clients reconnect with the last event ID.

SSE is appropriate for this project because notification traffic is server-to-client and does not require full bidirectional socket communication.

## 13. File Management

The files module supports upload, listing, download, and deletion of project-linked files.

Supported file types:

- PDF.
- DOCX.
- TXT.

File responsibilities:

- Store file metadata in MongoDB.
- Link files to projects and uploaders.
- Protect download and delete routes with authentication.
- Keep file records scoped to workspace access.
- Support local disk storage and optional S3-compatible storage.

## 14. Reporting and Dashboard

The dashboard gives users workspace-level visibility into project and delivery activity.

Dashboard metrics include:

- Total projects.
- Total meetings.
- Open tasks.
- Completed tasks.

The reporting system uses PDFKit to generate downloadable reports. The export flow supports workspace reporting and optional date filters. This helps teams share progress and meeting outcomes outside the application.

## 15. Admin Panel

The admin module provides system-level statistics for authorized administrators.

Admin access is intentionally global and separate from normal workspace data access. The admin stats route is protected by:

- `requireAuth`
- `requireAdmin`

Admin users can view system-wide counts such as:

- Total users.
- Total projects.
- Total meetings.
- System statistics.

## 16. API Overview

Base URL:

```text
http://localhost:4000/api
```

Major endpoints:

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Workspaces | `GET /workspaces` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/report` |
| Projects | `GET /projects`, `POST /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id` |
| Meetings | `GET /meetings`, `POST /meetings`, `GET /meetings/:id`, `PUT /meetings/:id`, `DELETE /meetings/:id` |
| Tasks | `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PUT /tasks/:id`, `PATCH /tasks/:id/complete`, `DELETE /tasks/:id` |
| AI | `POST /ai/analyze-notes`, `POST /ai/confirm-analysis`, `POST /ai/analyze-meeting`, `GET /ai/analysis/:meetingId`, `DELETE /ai/analysis/:meetingId` |
| Files | `POST /files/upload`, `GET /files/project/:projectId`, `GET /files/:id/download`, `DELETE /files/:id` |
| Activity | `GET /activity-logs` |
| Notifications | `GET /notifications/subscribe` |
| Export | `GET /export/pdf/:workspaceId` |
| Admin | `GET /admin/stats` |

A Postman collection is available in:

```text
docs/postman/Cyberify-AI-Meeting-Assistant.postman_collection.json
```

## 17. Environment Configuration

The system is configured through environment variables. Secrets must not be hardcoded.

Important backend variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend HTTP port |
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime |
| `FRONTEND_URL` | Frontend origin |
| `GROQ_API_KEY` | Groq AI provider key |
| `OPENAI_API_KEY` | OpenAI provider key |
| `GEMINI_API_KEY` | Gemini provider key |
| `AWS_REGION` | S3 region |
| `S3_BUCKET_NAME` | S3 bucket name |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `MAIL_FROM` | Email sender address |

Frontend/deployment variables:

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | Backend URL used by Next.js rewrites in Docker/deployment |
| `NEXT_PUBLIC_API_BASE` | Optional browser-visible API base |

## 18. Testing Strategy

The backend includes test tooling for API and integration testing:

- Jest.
- Supertest.
- mongodb-memory-server.

Recommended test coverage areas:

- Authentication success and failure flows.
- Refresh token rotation and logout revocation.
- Workspace isolation for projects, meetings, tasks, files, and AI analyses.
- Validation failures.
- AI mock fallback behavior.
- AI malformed JSON retry behavior.
- Admin route authorization.
- File access control.
- Dashboard metrics scoped by workspace.

Useful commands:

```powershell
npm --prefix backend test
npx tsc -p backend\tsconfig.json --noEmit
npx tsc -p frontend\tsconfig.json --noEmit
```

## 19. Deployment and Operations

The project includes Docker support for local or containerized runtime.

Docker services:

- Frontend on port `3000`.
- Backend on port `4000`.
- MongoDB on port `27017`.

Start with:

```powershell
docker-compose up --build
```

Operational considerations:

- Use strong production secrets.
- Store production secrets in a secure secret manager or deployment platform settings.
- Use a managed MongoDB service for production.
- Use persistent object storage such as S3 for production file uploads.
- Configure CORS for the deployed frontend origin.
- Enable HTTPS in production.
- Add centralized logging and monitoring.
- Configure backups for MongoDB and uploaded files.

## 20. Security Assessment

Current security strengths:

- JWT-based protected routes.
- Refresh token rotation.
- Hashed refresh token storage.
- Password hashing.
- Workspace-scoped data model.
- Admin middleware for privileged routes.
- Backend-only AI provider calls.
- Environment-variable configuration.
- File route protection.

Key security risks to monitor:

- Any query that omits `workspaceId` for workspace-owned data.
- Any route that trusts a client-supplied workspace ID without membership verification.
- File download paths that could allow path traversal if storage paths are not normalized.
- Overly broad CORS settings in production.
- Long-lived or leaked JWT secrets.
- AI output that is stored without validation or normalization.

Recommended security improvements:

- Add automated tenant-isolation tests for every workspace-scoped module.
- Add rate limiting to auth and AI routes.
- Add file size limits and malware scanning for production uploads.
- Add audit logging for admin actions.
- Add stricter content validation for file uploads.
- Add centralized error logging without exposing sensitive details to clients.

## 21. Quality and Maintainability

The codebase follows a clean modular structure and separates frontend, backend, data models, providers, services, and middleware. This supports future feature growth and reduces coupling between business logic and route handlers.

Positive quality indicators:

- TypeScript on both frontend and backend.
- Modular backend route organization.
- Mongoose models for persistent data.
- Validation with Zod.
- Consistent environment-based configuration.
- Mock AI fallback for demos and local development.
- Docker Compose support.
- Postman collection for API verification.

Areas to continue strengthening:

- Expand tests around tenant boundaries.
- Keep API response formats consistent across all modules.
- Add OpenAPI or generated API documentation.
- Add frontend form validation parity with backend validation.
- Add CI checks for linting, type checking, and backend tests.

## 22. Evaluation Against Requirements

| Requirement | Status |
| --- | --- |
| Signup, login, logout | Implemented |
| JWT access and refresh tokens | Implemented |
| Multi-tenant workspace isolation | Implemented as core backend rule |
| Dashboard metrics and charts | Implemented |
| Project CRUD | Implemented |
| Meeting CRUD | Implemented |
| AI requirement analysis | Implemented |
| AI task generation | Implemented |
| AI risk analysis | Implemented |
| Task management | Implemented |
| Search and filtering | Implemented for core modules |
| Real-time notifications | Implemented with SSE |
| File upload | Implemented |
| Activity logs | Implemented |
| Admin panel | Implemented |
| Email notification bonus | Supported for task assignment flow |
| Dark mode bonus | Supported through frontend styling/theme direction |
| PDF export bonus | Implemented |
| Docker bonus | Implemented |
| Postman collection | Included |

## 23. Recommended Next Steps

Priority improvements:

1. Add complete automated tests for workspace isolation across every module.
2. Add CI workflow for backend tests, frontend type checking, and backend type checking.
3. Add production-grade rate limiting and request logging.
4. Add OpenAPI documentation for all REST endpoints.
5. Improve frontend coverage for files, notifications, workspaces, and AI review flows if not already fully surfaced.
6. Add monitoring and alerting for production deployments.
7. Move production file storage to S3 or compatible object storage.
8. Add backup and restore documentation for MongoDB and uploaded files.

## 24. Conclusion

Cyberify AI Client Meeting Assistant is a strong full-stack SaaS implementation for transforming client meeting notes into structured delivery outputs. It covers the core product requirements: authentication, tenant isolation, project management, meeting management, AI analysis, task generation, risk detection, dashboards, notifications, files, activity logs, admin statistics, PDF exports, and Dockerized runtime.

The architecture is suitable for an agency-facing SaaS product because the backend acts as the trusted boundary for authentication, workspace isolation, AI provider calls, and data validation. With additional test coverage, production security hardening, and operational monitoring, the platform can evolve from a technical assessment implementation into a production-ready client meeting intelligence system.
