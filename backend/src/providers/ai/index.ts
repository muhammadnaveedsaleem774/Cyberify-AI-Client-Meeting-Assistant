import { config } from '../../config';

import { IMeeting } from '../../models/meeting.model';
import { validateAnalysisResult } from './aiUtils';
import { getMockAnalysis, MockAnalysisResult } from './mock';

export type AnalysisResult = {
  summary: string;
  functionalRequirements: string[];
  userRoles: string[];
  entities: string[];
  timeline: string[];
  tasks: Array<{ title: string; description?: string; priority?: 'Low' | 'Medium' | 'High'; assignee?: string; dueDate?: string }>;
  risks: string[];
  riskAnalysis: {
    missingRequirements: string[];
    ambiguousRequirements: string[];
    potentialRisks: string[];
  };
};

// Minimal provider interface
export interface AIProvider {
  analyzeMeeting(meeting: IMeeting): Promise<AnalysisResult>;
}

export function isMockMode() {
  return !process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY;
}

function toInternalAnalysisResult(mock: MockAnalysisResult): AnalysisResult {
  return validateAnalysisResult({
    summary: mock.summary,
    functionalRequirements: mock.functional_requirements,
    userRoles: mock.user_roles,
    entities: mock.db_entities,
    timeline: [mock.dev_timeline],
    tasks: mock.generated_tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority
    })),
    risks: mock.risks,
    riskAnalysis: {
      missingRequirements: mock.risks.filter((risk) => risk.type === 'missing'),
      ambiguousRequirements: mock.risks.filter((risk) => risk.type === 'ambiguous'),
      potentialRisks: mock.risks.filter((risk) => risk.type === 'technical' || risk.type === 'scope')
    }
  });
}

// Provider selection
export function getProvider(): AIProvider {
  if (config.groqApiKey) {
    const groq = require('./groqProvider') as { provider: AIProvider };
    return groq.provider;
  }
  if (config.openaiApiKey) {
    const openai = require('./openaiProvider') as { provider: AIProvider };
    return openai.provider;
  }
  if (config.geminiApiKey) {
    const gemini = require('./geminiProvider') as { provider: AIProvider };
    return gemini.provider;
  }
  if (isMockMode()) {
    return {
      async analyzeMeeting(meeting: IMeeting): Promise<AnalysisResult> {
        console.warn('[AI Provider] No API key found — using mock fallback. Set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in .env');
        const mock = await getMockAnalysis(String(meeting.notes || ''));
        return toInternalAnalysisResult(mock);
      }
    };
  }
  throw { status: 503, message: 'No AI provider is configured. Set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.' };
}

export async function analyzeWithProvider(meeting: IMeeting) {
  const provider = getProvider();
  return provider.analyzeMeeting(meeting);
}
