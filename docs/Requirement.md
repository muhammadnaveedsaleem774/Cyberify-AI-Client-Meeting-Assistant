# Project Brief

# Cyberify AI Client Meeting Assistant

Technical Assessment — SaaS Platform Development

## Project Overview

| Field | Value |
| --- | --- |
| Candidate | Muhammad Naveed Saleem |
| Company | Cyberify |
| Deadline | 7 Days (168 Hours) |
| Project Title | Cyberify AI Client Meeting Assistant |

A SaaS platform that helps agencies and software houses automatically analyze client meetings and generate actionable insights using AI. Think of it as a lightweight combination of:

• Notion AI  
• Fireflies AI  
• Otter AI  
• CRM

## Business Scenario

Cyberify handles multiple clients every day. After every meeting, the following problems arise:

• Meeting notes are messy  
• Requirements are unclear  
• Tasks are forgotten  
• Follow-ups are delayed

The goal is to build a SaaS platform that solves these problems.

## Core Features

### 1. Authentication

Implement the following authentication flows:

• Signup  
• Login  
• Logout

Use JWT access tokens and refresh tokens. Access tokens must expire, and protected routes must require authentication.

### 2. Multi-Tenant SaaS

Each user belongs to a workspace.

Example:

• Workspace A → Projects, Meetings, Tasks  
• Workspace B → Projects, Meetings, Tasks

No data leakage is allowed between workspaces.

### 3. Dashboard

Display the following metrics with charts:

• Total Projects  
• Total Meetings  
• Open Tasks  
• Completed Tasks

### 4. Project Management Module

Users can perform full CRUD operations: create, edit, and delete projects.

Project fields include:

• Name  
• Client Name  
• Description  
• Status

### 5. Meeting Module

Users can create, edit, and delete meetings.

Meeting fields include:

• Title  
• Meeting Notes  
• Date

### 6. AI Requirement Analysis — Main Feature

The user enters meeting notes, and the AI generates a structured analysis.

Example input:

> "We need a car marketplace platform with admin, seller and buyer roles. Sellers should upload cars and buyers can purchase."

AI-generated output includes:

• Project Summary  
• Functional Requirements  
• User Roles  
• Suggested Database Entities  
• Development Timeline

Supported AI providers: OpenAI, Groq, Gemini, or any compatible provider.

### 7. AI Task Generator

From meeting notes, AI automatically generates tasks.

Example:

• Task 1: Create Authentication System  
• Task 2: Create Product Module  
• Task 3: Create Payment Integration

### 8. AI Risk Analysis

AI identifies risks and gaps in requirements, such as:

• Missing Requirements  
• Ambiguous Requirements  
• Potential Risks

Examples:

• "No payment gateway specified."  
• "User roles not fully defined."

### 9. Task Management

AI-generated tasks become real actionable items. Users can:

• Assign Priority: Low / Medium / High  
• Mark tasks as Complete

### 10. Search & Filtering

Full search support across all modules:

• Search Projects, Meetings, and Tasks  
• Filter by Status, Date, and Priority

### 11. Real-Time Notifications

Implement one of the following: Socket.io or SSE.

Notification events include:

• Task Created  
• Task Completed  
• Meeting Added

### 12. File Upload

Allow users to upload files and link them to projects.

Supported file types:

• PDF  
• DOCX  
• TXT

### 13. Activity Logs

Track system events with a timeline display:

• Project Created  
• Task Updated  
• Meeting Deleted

### 14. Admin Panel

Admin users can view system-wide statistics:

• Total Users  
• Total Projects  
• Total Meetings  
• System Statistics

Implementation note: the backend admin stats route is protected by both authentication middleware and `requireAdmin` role middleware.

## Technical Requirements

### Frontend

• Choose React or Next.js  
• Responsive design  
• Reusable components  
• Proper folder structure

### Backend

• Choose Node.js + Express  
• Modular architecture  
• Error handling  
• Input validation

### Database

• Choose MongoDB  
• Proper relations between collections  
• Indexing consideration for performance

### AI Integration

• Prompt engineering  
• Structured AI response  
• JSON format preferred for AI outputs

## Bonus Features

The following bonus features separate average developers from strong developers:

• Email notification: send task assignment emails  
• Dark mode: implement full theme switching  
• Export reports: export as PDF  
• Docker: Dockerize the full application  
• Deployment: deploy both frontend and backend

## Submission Requirements

Candidate must submit all of the following:

• Source code: GitHub repository, public or shared  
• Documentation: README including setup, architecture, database design, and AI flow  
• API collection: Postman collection with all endpoints  
• Demo video: 5-10 minutes explaining architecture, features, and AI flow

## Current Backend Implementation

See `docs/architecture.md` for current implementation details.

## Evaluation Criteria

| Area | Marks |
| --- | ---: |
| Frontend Architecture | 15 |
| Backend Architecture | 15 |
| Database Design | 10 |
| Authentication | 10 |
| AI Features | 20 |
| Code Quality | 10 |
| Real-Time Features | 5 |
| UI/UX | 5 |
| Documentation | 5 |
| Deployment / Docker | 5 |
| Total | 100 |

Cyberify • Fueling Success Stories Every Day • From Startups to Enterprises
