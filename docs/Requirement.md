
PROJECT BRIEF
Cyberify AI Client Meeting Assistant
Technical Assessment — SaaS Platform Development
Project Overview  ●

Candidate	Muhammad Naveed Saleem
Company	Cyberify
Deadline	7 Days (168 Hours)
Project Title	Cyberify AI Client Meeting Assistant

A SaaS platform that helps agencies and software houses automatically analyze client meetings and generate actionable insights using AI. Think of it as a combination of:

●	Notion AI
●	Fireflies AI
●	Otter AI
●	CRM

— combined into one lightweight SaaS.

Business Scenario  ●
Cyberify handles multiple clients every day. After every meeting, the following problems arise:

●	Meeting notes are messy
●	Requirements are unclear
●	Tasks are forgotten
●	Follow-ups are delayed

Your goal is to build a SaaS platform that solves this problem.

Core Features  ●
1. Authentication
Implement the following authentication flows:
●	Signup
●	Login
●	Logout
Using: JWT & Refresh Tokens
Required: Access Token Expiry, Protected Routes

2. Multi-Tenant SaaS
Each user belongs to their own workspace. Example structure:
●	Workspace A → Projects, Meetings, Tasks
●	Workspace B → Projects, Meetings, Tasks
No data leakage is allowed between workspaces.

3. Dashboard
Display the following metrics with charts:
●	Total Projects
●	Total Meetings
●	Open Tasks
●	Completed Tasks

4. Project Management Module
Users can perform full CRUD operations: Create, Edit, and Delete projects.
Project fields include: Name, Client Name, Description, Status.

5. Meeting Module
Users can Create, Edit, and Delete meetings.
Meeting fields include: Title, Meeting Notes, Date.

6. AI Requirement Analysis  ★ Main Feature
The user enters meeting notes, and the AI generates a full structured analysis. Example input:
"We need a car marketplace platform with admin, seller and buyer roles. Sellers should upload cars and buyers can purchase."
AI-generated output includes:
●	Project Summary
●	Functional Requirements
●	User Roles
●	Suggested Database Entities
●	Development Timeline
Supported AI providers: OpenAI, Groq, Gemini, or any provider.

7. AI Task Generator
From meeting notes, AI automatically generates tasks. Example:
●	Task 1: Create Authentication System
●	Task 2: Create Product Module
●	Task 3: Create Payment Integration

8. AI Risk Analysis
AI identifies risks and gaps in requirements, such as:
●	Missing Requirements
●	Ambiguous Requirements
●	Potential Risks
Examples: "No payment gateway specified." / "User roles not fully defined."

9. Task Management
AI-generated tasks become real actionable items. Users can:
●	Assign Priority: Low / Medium / High
●	Mark tasks as Complete

10. Search & Filtering
Full search support across all modules:
●	Search Projects, Meetings, and Tasks
●	Filter by Status, Date, and Priority

11. Real-Time Notifications
Implement one of the following: Socket.io or SSE.
Notification events include:
●	Task Created
●	Task Completed
●	Meeting Added

12. File Upload
Allow users to upload files (PDF, DOCX, TXT) and link them to projects.

13. Activity Logs
Track system events with a timeline display:
●	Project Created
●	Task Updated
●	Meeting Deleted

14. Admin Panel
Admin can view system-wide statistics:
●	Total Users
●	Total Projects
●	Total Meetings
●	System Statistics

Technical Requirements  ●
Frontend
●	Choose React or Next.js
●	Responsive Design
●	Reusable Components
●	Proper Folder Structure

Backend
●	Choose Node.js + Express
●	Modular Architecture
●	Error Handling
●	Input Validation

Database
●	Choose MongoDB
●	Proper Relations between Collections
●	Indexing Consideration for Performance

AI Integration
●	Prompt Engineering
●	Structured AI Response
●	JSON format preferred for AI outputs

Bonus Features  ●
The following bonus features separate average developers from strong developers:

●	Email Notification: Send task assignment emails.
●	Dark Mode: Implement full theme switching.
●	Export Reports: Export as PDF.
●	Docker: Dockerize the full application.
●	Deployment: Deploy both frontend and backend.

Submission Requirements  ●
Candidate must submit all of the following:

●	Source Code: GitHub Repository (public or shared).
●	Documentation: README including Setup, Architecture, Database Design, and AI Flow.
●	API Collection: Postman Collection with all endpoints.
●	Demo Video: 5–10 minutes explaining Architecture, Features, and AI Flow.

Current Backend Implementation (summary)
● Stack: Node.js + Express + TypeScript + MongoDB (Mongoose). Tests using Mocha/Chai + mongodb-memory-server.
● Implemented modules and routes (workspace-scoped unless noted):
	- `POST /api/auth/signup`, `POST /api/auth/login` (JWT access + refresh tokens)
	- `GET /api/workspaces` (protected)
	- `CRUD /api/projects` (create/update/delete/fetch)
	- `CRUD /api/meetings`
	- `CRUD /api/tasks` + `PATCH /api/tasks/:id/complete`
	- `POST /api/ai/analyze-meeting` (AI analysis orchestration; saves `AIAnalysis`, generates Tasks)
	- `GET /api/dashboard/stats` (workspace stats)
	- `GET /api/activity-logs` (recent workspace activity)
	- `POST /api/files/upload` (multer file upload; accepts PDF, DOCX, TXT) and `GET /api/files/project/:projectId`
	- `GET /api/notifications/subscribe` (SSE endpoint for workspace notifications)
	- `GET /api/admin/stats` (system-wide admin stats)

● Models added:
	- `Activity` — stores activity logs (type, meta, workspaceId, userId, createdAt)
	- `File` — stores uploaded file metadata and link to `Project` + workspace
	- `AIAnalysis` — stores AI analysis results and generated tasks (already present in codebase)

● Services and behavior:
	- Activity writing via `activityService.recordActivity` is called on Project/Meeting/Task/AI events.
	- Notifications via a simple SSE `notificationsService.notify(workspaceId, event, payload)` called on create/complete/add events.
	- Dashboard metrics computed in `dashboardService.getWorkspaceStats` using aggregation queries.
	- File uploads stored on disk under `backend/uploads` using `multer` and metadata saved with `fileService.saveFile`.

● Notes and constraints:
	- All user-facing queries are filtered by `workspaceId` to ensure tenant isolation.
	- Admin stats endpoint is system-wide; role checks are TODO/optional (currently requires auth).
	- AI providers are implemented with a provider abstraction and a mock fallback; real provider keys (OpenAI/Gemini) are supported via env vars.
	- Type augmentation for `req.user` is provided via `src/types/express-augment.ts` (loaded at runtime in `src/app.ts`) so tests and ts-node recognize the property.

● Tests:
	- Integration tests exist under `backend/test/integration` (auth, modules, dashboard). Run with `npm --prefix backend test`.

If you'd like, I can now:
- Add admin role enforcement on `GET /api/admin/stats`.
- Replace SSE with Socket.io for full websocket support.
- Add more integration tests for files, activity logs, and notifications.


Evaluation Criteria  (100 Marks Total)  ●

Area	Marks
Frontend Architecture	15
Backend Architecture	15
Database Design	10
Authentication	10
AI Features	20
Code Quality	10
Real-Time Features	5
UI/UX	5
Documentation	5
Deployment / Docker	5
TOTAL	100

Cyberify  •  Fueling Success Stories Every Day  •  From Startups to Enterprises
