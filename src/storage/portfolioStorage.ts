import { SEED_PORTFOLIO } from '../engine/strategyEngine';
import { validateAndParsePortfolioJson } from '../security/sanitizer';
import { ProductNode } from '../types/strategy';

const STORAGE_KEY = 'cadence_bridge_portfolio_v1';

export function loadPortfolio(): ProductNode[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_PORTFOLIO;
    const result = validateAndParsePortfolioJson(raw);
    return result.ok ? result.data : SEED_PORTFOLIO;
  } catch {
    return SEED_PORTFOLIO;
  }
}

export function savePortfolio(products: ProductNode[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function exportPortfolioJson(products: ProductNode[]): string {
  return JSON.stringify(
    {
      schema: 'cadence-bridge-v1',
      exportedAt: new Date().toISOString(),
      products,
    },
    null,
    2
  );
}
