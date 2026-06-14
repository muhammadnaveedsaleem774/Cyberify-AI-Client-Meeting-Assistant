# Project Context

We are building Cyberify AI Client Meeting Assistant.

It is a multi-tenant SaaS platform for agencies/software houses.

Core stack:
- Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Auth: JWT access token + refresh token
- AI: OpenAI/Gemini/Groq with mock fallback
- Real-time: Socket.io or SSE

Rules:
- Every workspace data query must include workspaceId.
- No project, meeting, task, file, activity log, or AI analysis should be accessible across workspaces.
- Use clean modular architecture.
- Use validation, error handling, and consistent API responses.
- Do not hardcode secrets.
- Use environment variables.
- Write readable, production-style code.