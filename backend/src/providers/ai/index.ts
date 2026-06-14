import { config } from '../../config';

import { IMeeting } from '../../models/meeting.model';

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
  throw { status: 503, message: 'No AI provider is configured. Set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.' };
}

export async function analyzeWithProvider(meeting: IMeeting) {
  const provider = getProvider();
  return provider.analyzeMeeting(meeting);
}
