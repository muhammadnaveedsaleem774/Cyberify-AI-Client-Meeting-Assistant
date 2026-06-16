export type MockAnalysisResult = {
  summary: string;
  functional_requirements: string[];
  user_roles: Array<{ role: string; description: string }>;
  db_entities: Array<{ entity: string; fields: string[] }>;
  dev_timeline: string;
  generated_tasks: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'feature' | 'setup' | 'testing';
    estimated_hours: number;
    phase: 'backend' | 'frontend' | 'database' | 'setup' | 'testing';
  }>;
  risks: Array<{
    type: 'missing' | 'ambiguous' | 'technical' | 'scope';
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  overall_risk_level: 'medium';
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMockAnalysis(notes: string): Promise<MockAnalysisResult> {
  await delay(1500);

  const context = notes.trim()
    ? 'The meeting notes describe a client-facing software platform with role-based workflows, project data, and operational follow-up needs.'
    : 'The meeting notes are limited, so this demo analysis assumes a standard client project management workflow.';

  return {
    summary: `${context} The proposed MVP should focus on secure access, structured records, task tracking, and a clear review flow so the team can validate requirements before scaling the product.`,
    functional_requirements: [
      'Create secure authentication with access and refresh token handling.',
      'Manage client projects with status, description, and client ownership details.',
      'Capture meeting notes and link them to the correct project workspace.',
      'Generate actionable tasks from meeting notes with priority and delivery phase.',
      'Display dashboard metrics for projects, meetings, open tasks, and completed tasks.',
      'Track activity logs for important workspace events and user actions.'
    ],
    user_roles: [
      {
        role: 'Workspace Admin',
        description: 'Manages workspace members, project setup, reports, and overall delivery visibility.'
      },
      {
        role: 'Project Member',
        description: 'Reviews meetings, updates tasks, uploads supporting files, and tracks assigned work.'
      },
      {
        role: 'Client Stakeholder',
        description: 'Provides meeting requirements, reviews deliverables, and clarifies open questions.'
      }
    ],
    db_entities: [
      {
        entity: 'Workspace',
        fields: ['id', 'name', 'ownerId', 'members', 'settings', 'createdAt']
      },
      {
        entity: 'Project',
        fields: ['id', 'workspaceId', 'name', 'clientName', 'description', 'status', 'createdBy']
      },
      {
        entity: 'Meeting',
        fields: ['id', 'workspaceId', 'projectId', 'title', 'notes', 'date', 'createdBy']
      },
      {
        entity: 'Task',
        fields: ['id', 'workspaceId', 'projectId', 'meetingId', 'title', 'description', 'priority', 'status']
      }
    ],
    dev_timeline: 'A realistic MVP timeline is 3 to 4 weeks: setup and authentication in week 1, core project and meeting modules in week 2, AI/task workflows in week 3, and testing, reports, and polish in week 4.',
    generated_tasks: [
      {
        title: 'Set up backend environment and shared configuration',
        description: 'Create environment validation, database connection, error handling, and consistent API response helpers.',
        priority: 'high',
        category: 'setup',
        estimated_hours: 6,
        phase: 'setup'
      },
      {
        title: 'Implement JWT authentication and refresh token rotation',
        description: 'Build signup, login, refresh, logout, protected middleware, and refresh-token persistence.',
        priority: 'high',
        category: 'feature',
        estimated_hours: 10,
        phase: 'backend'
      },
      {
        title: 'Create workspace-scoped project and meeting APIs',
        description: 'Add CRUD endpoints with validation and workspace isolation for projects and meetings.',
        priority: 'high',
        category: 'feature',
        estimated_hours: 12,
        phase: 'backend'
      },
      {
        title: 'Design MongoDB schemas and workspace indexes',
        description: 'Define collections for workspaces, projects, meetings, tasks, AI analyses, files, and activities.',
        priority: 'medium',
        category: 'setup',
        estimated_hours: 8,
        phase: 'database'
      },
      {
        title: 'Build dashboard and task management screens',
        description: 'Create responsive frontend pages for metrics, task filters, task completion, and basic CRUD actions.',
        priority: 'medium',
        category: 'feature',
        estimated_hours: 14,
        phase: 'frontend'
      },
      {
        title: 'Add AI analysis review and task generation workflow',
        description: 'Show generated requirements, risks, entities, timeline, and editable task suggestions before saving.',
        priority: 'medium',
        category: 'feature',
        estimated_hours: 12,
        phase: 'frontend'
      },
      {
        title: 'Write tenant isolation and auth integration tests',
        description: 'Verify protected routes, cross-workspace access blocking, refresh rotation, and validation failures.',
        priority: 'high',
        category: 'testing',
        estimated_hours: 10,
        phase: 'testing'
      }
    ],
    risks: [
      {
        type: 'missing',
        title: 'Acceptance criteria are not fully defined',
        description: 'The notes do not specify exact success conditions for each module, which may cause rework during delivery.',
        severity: 'medium',
        suggestion: 'Create a short acceptance checklist for authentication, projects, meetings, tasks, and reports.'
      },
      {
        type: 'ambiguous',
        title: 'User permissions need clarification',
        description: 'The expected differences between admin, member, and client access are not completely described.',
        severity: 'medium',
        suggestion: 'Confirm role permissions before implementing workspace invitations and admin screens.'
      },
      {
        type: 'technical',
        title: 'AI output quality may vary',
        description: 'Provider responses can be incomplete or malformed without strict schema validation and retry handling.',
        severity: 'medium',
        suggestion: 'Validate AI responses, normalize legacy fields, and keep a mock fallback for demos and outages.'
      },
      {
        type: 'scope',
        title: 'Reporting and notifications can expand quickly',
        description: 'PDF exports, emails, real-time notifications, and activity logs may require additional edge-case handling.',
        severity: 'low',
        suggestion: 'Keep the MVP focused on the core report and a small set of high-value notification events.'
      }
    ],
    overall_risk_level: 'medium'
  };
}
