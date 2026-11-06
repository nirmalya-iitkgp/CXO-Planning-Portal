import {
  AnsoffStrategy,
  BcgQuadrant,
  KeyResult,
  Objective,
  ProductNode,
  ResourceCap,
  ReviewCadence,
  StrategicLever,
} from '../types/strategy';

const VALID_QUADRANTS = new Set<BcgQuadrant>(['star', 'question_mark', 'cash_cow', 'dog']);
const VALID_ANSOFF = new Set<AnsoffStrategy>([
  'market_penetration',
  'market_development',
  'product_development',
  'diversification',
]);
const VALID_LEVERS = new Set<StrategicLever>([
  'Core Feature Velocity',
  'Tiered Pricing & Packaging',
  'Geographic Expansion',
  'Adjacent Segment Entry',
  'Platform Modularization',
  'Margin & Cost Discipline',
  'Validation & Gatekeeping',
]);
const VALID_CADENCES = new Set<ReviewCadence>(['Weekly', 'Bi-Weekly', 'Monthly']);
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const MAX_JSON_BYTES = 250_000;
const MAX_PRODUCTS = 50;

/**
 * Strips HTML tags, dangerous URI schemes, inline event handlers, and control characters.
 */
export function sanitizeText(input: unknown, maxLength = 120): string {
  if (typeof input !== 'string') return '';
  const cleaned = input
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Clamps a numeric input to [min, max], returning fallback if non-finite.
 */
export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Number(num.toFixed(2))));
}

/**
 * Recursively clones plain objects/arrays while stripping prototype-pollution keys.
 */
export function stripDangerousKeys<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripDangerousKeys(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const safeObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      if (!DANGEROUS_KEYS.has(key)) {
        safeObj[key] = stripDangerousKeys(val);
      }
    }
    return safeObj as T;
  }
  return input;
}

function validateKeyResult(raw: unknown, idx: number): KeyResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const kr = raw as Record<string, unknown>;
  const title = sanitizeText(kr.title, 140);
  if (!title) return null;
  const startValue = clampNumber(kr.startValue, -1_000_000, 1_000_000, 0);
  const targetValue = clampNumber(kr.targetValue, -1_000_000, 1_000_000, 100);
  const currentValue = clampNumber(kr.currentValue, -1_000_000, 1_000_000, startValue);
  return {
    id: sanitizeText(kr.id, 48) || `kr-${idx + 1}`,
    title,
    metricUnit: sanitizeText(kr.metricUnit, 24) || '%',
    startValue,
    targetValue,
    currentValue,
  };
}

function validateObjective(raw: unknown, idx: number): Objective | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title = sanitizeText(obj.title, 160);
  if (!title || !Array.isArray(obj.keyResults)) return null;
  const keyResults = obj.keyResults
    .slice(0, 8)
    .map((kr, i) => validateKeyResult(kr, i))
    .filter((kr): kr is KeyResult => kr !== null);
  if (keyResults.length === 0) return null;
  return {
    id: sanitizeText(obj.id, 48) || `obj-${idx + 1}`,
    title,
    keyResults,
  };
}

function validateResourceCap(raw: unknown): ResourceCap | null {
  if (!raw || typeof raw !== 'object') return null;
  const cap = raw as Record<string, unknown>;
  const cadence = VALID_CADENCES.has(cap.reviewCadence as ReviewCadence)
    ? (cap.reviewCadence as ReviewCadence)
    : 'Bi-Weekly';
  return {
    maxBudgetPct: clampNumber(cap.maxBudgetPct, 1, 100, 25),
    allocatedBudgetPct: clampNumber(cap.allocatedBudgetPct, 0, 100, 20),
    maxFte: clampNumber(cap.maxFte, 1, 500, 8),
    reviewCadence: cadence,
  };
}

export function validateAndParsePortfolioJson(
  rawJson: string
): { ok: true; data: ProductNode[] } | { ok: false; error: string } {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    return { ok: false, error: 'JSON payload is empty.' };
  }
  if (rawJson.length > MAX_JSON_BYTES) {
    return { ok: false, error: 'JSON payload exceeds 250KB safety limit.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: 'Invalid JSON syntax.' };
  }

  const clean = stripDangerousKeys(parsed);
  const rawList = Array.isArray(clean)
    ? clean
    : clean && typeof clean === 'object' && Array.isArray((clean as Record<string, unknown>).products)
      ? ((clean as Record<string, unknown>).products as unknown[])
      : null;

  if (!rawList || rawList.length === 0) {
    return { ok: false, error: 'Expected a non-empty array of products.' };
  }
  if (rawList.length > MAX_PRODUCTS) {
    return { ok: false, error: `Portfolio cannot exceed ${MAX_PRODUCTS} products.` };
  }

  const validated: ProductNode[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `Invalid product entry at index ${i}.` };
    }
    const p = item as Record<string, unknown>;
    const name = sanitizeText(p.name, 80);
    if (!name) {
      return { ok: false, error: `Missing valid product name at index ${i}.` };
    }
    const bcgQuadrant = p.bcgQuadrant as BcgQuadrant;
    const ansoffStrategy = p.ansoffStrategy as AnsoffStrategy;
    if (!VALID_QUADRANTS.has(bcgQuadrant) || !VALID_ANSOFF.has(ansoffStrategy)) {
      return { ok: false, error: `Invalid BCG or Ansoff classification for "${name}".` };
    }
    const strategicLever = VALID_LEVERS.has(p.strategicLever as StrategicLever)
      ? (p.strategicLever as StrategicLever)
      : 'Core Feature Velocity';

    const resourceCap = validateResourceCap(p.resourceCap);
    if (!resourceCap) {
      return { ok: false, error: `Invalid resource cap for "${name}".` };
    }

    const okrs = Array.isArray(p.okrs)
      ? p.okrs
          .slice(0, 6)
          .map((o, idx) => validateObjective(o, idx))
          .filter((o): o is Objective => o !== null)
      : [];

    if (okrs.length === 0) {
      return { ok: false, error: `Product "${name}" must include at least one valid Objective.` };
    }

    const previousBcgQuadrant = VALID_QUADRANTS.has(p.previousBcgQuadrant as BcgQuadrant)
      ? (p.previousBcgQuadrant as BcgQuadrant)
      : undefined;

    validated.push({
      id: sanitizeText(p.id, 48) || `prod-${i + 1}`,
      name,
      owner: sanitizeText(p.owner, 60) || 'Strategy Lead',
      marketShare: clampNumber(p.marketShare, 0.1, 4.0, 1.0),
      marketGrowth: clampNumber(p.marketGrowth, 0, 40, 15),
      bcgQuadrant,
      ...(previousBcgQuadrant ? { previousBcgQuadrant } : {}),
      ansoffStrategy,
      strategicLever,
      resourceCap,
      okrs,
      updatedAt: sanitizeText(p.updatedAt, 40) || new Date().toISOString(),
    });
  }

  return { ok: true, data: validated };
}
