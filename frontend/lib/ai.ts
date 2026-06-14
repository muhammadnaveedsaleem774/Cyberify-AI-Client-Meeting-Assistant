export type NormalizedTask = {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
};

export type NormalizedRiskAnalysis = {
  missingRequirements: string[];
  ambiguousRequirements: string[];
  potentialRisks: string[];
};

export type NormalizedAnalysis = {
  summary: string;
  functionalRequirements: string[];
  userRoles: string[];
  entities: string[];
  timeline: string[];
  tasks: NormalizedTask[];
  risks: string[];
  riskAnalysis: NormalizedRiskAnalysis;
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
  const source = Array.isArray(value) && value.length > 0
    ? value
    : Array.isArray(fallback) && fallback.length > 0
      ? fallback
      : [];
  return source.map(stringifyItem).filter(Boolean);
}

function toTasks(value: unknown): NormalizedTask[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      title: String(item.title || '').trim(),
      description: item.description ? String(item.description).trim() : undefined,
      priority: normalizePriority(item.priority)
    }))
    .filter((item) => item.title);
}

function normalizePriority(value: unknown): 'Low' | 'Medium' | 'High' {
  const raw = String(value || '').toLowerCase();
  if (raw === 'low') return 'Low';
  if (raw === 'high') return 'High';
  return 'Medium';
}

function toRiskAnalysis(raw: Record<string, unknown>, legacyRisks: string[]): NormalizedRiskAnalysis {
  const source = raw.riskAnalysis && typeof raw.riskAnalysis === 'object' && !Array.isArray(raw.riskAnalysis)
    ? raw.riskAnalysis as Record<string, unknown>
    : {};
  const missingFallback = legacyRisks.filter((risk) => /missing|not specified|unspecified/i.test(risk));
  const ambiguousFallback = legacyRisks.filter((risk) => /ambiguous|unclear|vague/i.test(risk));
  const potentialFallback = legacyRisks.filter((risk) => !missingFallback.includes(risk) && !ambiguousFallback.includes(risk));
  return {
    missingRequirements: toStringArray(source.missingRequirements, missingFallback),
    ambiguousRequirements: toStringArray(source.ambiguousRequirements, ambiguousFallback),
    potentialRisks: toStringArray(source.potentialRisks, potentialFallback)
  };
}

export function normalizeAnalysis(value: unknown): NormalizedAnalysis | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const risks = toStringArray(raw.risks);
  const riskAnalysis = toRiskAnalysis(raw, risks);
  const mergedRisks = [
    ...riskAnalysis.missingRequirements,
    ...riskAnalysis.ambiguousRequirements,
    ...riskAnalysis.potentialRisks,
    ...risks
  ].filter((risk, index, all) => risk && all.indexOf(risk) === index);
  return {
    summary: String(raw.summary || '').trim(),
    functionalRequirements: toStringArray(raw.functionalRequirements, raw.requirements),
    userRoles: toStringArray(raw.userRoles, raw.roles),
    entities: toStringArray(raw.entities),
    timeline: toStringArray(raw.timeline),
    tasks: toTasks(raw.tasks),
    risks: mergedRisks,
    riskAnalysis,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined
  };
}
