export type NormalizedTask = {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
};

export type NormalizedAnalysis = {
  summary: string;
  functionalRequirements: string[];
  userRoles: string[];
  entities: string[];
  timeline: string[];
  tasks: NormalizedTask[];
  risks: string[];
  createdAt?: string;
  updatedAt?: string;
};

function stringifyItem(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const label = record.name || record.phase || record.title || record.role;
    const details = Object.entries(record)
      .filter(([key]) => !['name', 'phase', 'title', 'role'].includes(key))
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join('; ');
    return [label ? String(label).trim() : '', details].filter(Boolean).join(' - ');
  }
  return String(item || '').trim();
}

function toStringArray(value: unknown, fallback: unknown = []): string[] {
  const source = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
  return source.map(stringifyItem).filter(Boolean);
}

function toTasks(value: unknown): NormalizedTask[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      title: String(item.title || '').trim(),
      description: item.description ? String(item.description).trim() : undefined,
      priority: ['Low', 'Medium', 'High'].includes(String(item.priority)) ? item.priority as 'Low' | 'Medium' | 'High' : 'Medium'
    }))
    .filter((item) => item.title);
}

export function normalizeAnalysis(value: unknown): NormalizedAnalysis | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return {
    summary: String(raw.summary || '').trim(),
    functionalRequirements: toStringArray(raw.functionalRequirements, raw.requirements),
    userRoles: toStringArray(raw.userRoles, raw.roles),
    entities: toStringArray(raw.entities),
    timeline: toStringArray(raw.timeline),
    tasks: toTasks(raw.tasks),
    risks: toStringArray(raw.risks),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined
  };
}
