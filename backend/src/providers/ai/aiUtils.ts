import type { IMeeting } from '../../models/meeting.model';
import type { AnalysisResult } from './index';

type JsonObject = Record<string, unknown>;
type ChatMessage = { role: string; content: string };

const AI_TIMEOUT_MS = 30000;

export function buildAnalysisMessages(meeting: IMeeting, retry = false): ChatMessage[] {
  const notes = String(meeting.notes || '').trim();
  return [
    {
      role: 'system',
      content:
        'You are a senior software analyst. Return only valid JSON. Do not include markdown, code fences, comments, or prose outside JSON.'
    },
    {
      role: 'user',
      content: [
        retry ? 'Your previous response was invalid. Try again and return strict JSON only.' : '',
        'Analyze these client meeting notes and produce a structured software requirements analysis.',
        '',
        `Meeting title: ${meeting.title || 'Untitled meeting'}`,
        `Meeting date: ${meeting.date ? new Date(meeting.date).toISOString() : 'Not provided'}`,
        '',
        'Meeting notes:',
        notes || 'No notes provided.',
        '',
        'Return JSON with exactly these top-level keys:',
        '{',
        '  "summary": "clear project summary",',
        '  "functionalRequirements": ["functional requirement"],',
        '  "userRoles": ["user role"],',
        '  "entities": ["EntityName: important fields and relationships"],',
        '  "timeline": ["Phase 1: deliverables and duration"],',
        '  "risks": ["risk or ambiguity"]',
        '}',
        '',
        'All values except summary must be arrays of strings. Use empty arrays only if no relevant item exists.'
      ].filter(Boolean).join('\n')
    }
  ];
}

export function extractJsonObject(content: string): JsonObject {
  const trimmed = content.trim();
  if (!trimmed) throw { status: 502, message: 'AI provider returned an empty response' };

  try {
    return JSON.parse(trimmed) as JsonObject;
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as JsonObject;
    } catch {}
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as JsonObject;
    } catch {}
  }

  throw { status: 502, message: 'AI provider returned invalid JSON' };
}

function stringifyItem(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const name = record.name || record.phase || record.title || record.role;
    const details = Object.entries(record)
      .filter(([key]) => !['name', 'phase', 'title', 'role'].includes(key))
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join('; ');
    return [name ? String(name).trim() : '', details].filter(Boolean).join(' - ');
  }
  return String(item || '').trim();
}

function asStringArray(value: unknown, field: string, aliases: unknown[] = []): string[] {
  const source = Array.isArray(value) ? value : aliases.find(Array.isArray);
  if (!Array.isArray(source)) throw { status: 502, message: `AI response missing ${field}` };
  return source.map(stringifyItem).filter(Boolean);
}

export function deriveTasks(functionalRequirements: string[]): AnalysisResult['tasks'] {
  return functionalRequirements.slice(0, 10).map((requirement) => ({
    title: requirement.length > 90 ? `${requirement.slice(0, 87)}...` : requirement,
    description: requirement,
    priority: 'Medium'
  }));
}

export function validateAnalysisResult(raw: JsonObject): AnalysisResult {
  const summary = String(raw.summary || '').trim();
  if (!summary) throw { status: 502, message: 'AI response missing summary' };
  const functionalRequirements = asStringArray(raw.functionalRequirements, 'functionalRequirements', [raw.requirements]);
  const userRoles = asStringArray(raw.userRoles, 'userRoles', [raw.roles]);

  return {
    summary,
    functionalRequirements,
    userRoles,
    entities: asStringArray(raw.entities, 'entities'),
    timeline: asStringArray(raw.timeline, 'timeline'),
    tasks: deriveTasks(functionalRequirements),
    risks: Array.isArray(raw.risks) ? raw.risks.map(stringifyItem).filter(Boolean) : []
  };
}

export async function parseProviderResponse(response: Response, providerName: string): Promise<JsonObject> {
  const body = await response.text();
  let parsed: JsonObject | null = null;
  try {
    parsed = body ? JSON.parse(body) as JsonObject : null;
  } catch {}

  if (!response.ok) {
    const message =
      (parsed?.error && typeof parsed.error === 'object' && 'message' in parsed.error && String(parsed.error.message)) ||
      (parsed?.message && String(parsed.message)) ||
      body ||
      `${providerName} request failed`;
    if (response.status === 429) throw { status: 429, message: `${providerName} rate limit exceeded` };
    if (response.status === 404) throw { status: 502, message: `${providerName} model not found or not supported. Check the configured model name. Provider message: ${message}` };
    throw { status: 502, message: `${providerName} request failed. Provider message: ${message}` };
  }

  if (!parsed) throw { status: 502, message: `${providerName} returned an empty response` };
  return parsed;
}

export async function fetchWithTimeout(url: string, init: RequestInit, providerName: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw { status: 504, message: `${providerName} request timed out` };
    throw { status: 502, message: `${providerName} request failed` };
  } finally {
    clearTimeout(timer);
  }
}

export async function withJsonRetry(run: (retry: boolean) => Promise<string>): Promise<AnalysisResult> {
  try {
    return validateAnalysisResult(extractJsonObject(await run(false)));
  } catch (err: any) {
    if (err?.status !== 502) throw err;
    return validateAnalysisResult(extractJsonObject(await run(true)));
  }
}
