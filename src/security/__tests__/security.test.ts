import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEED_PORTFOLIO } from '../../engine/strategyEngine';
import {
  clampNumber,
  sanitizeText,
  stripDangerousKeys,
  validateAndParsePortfolioJson,
} from '../sanitizer';

describe('Security & Red-Pill / Blue-Pill Validation', () => {
  // BLUE-PILL TESTS: Legitimate executive inputs
  it('Blue-Pill: preserves legitimate product names and valid portfolio JSON', () => {
    assert.equal(sanitizeText('Helios Cloud & Edge v2.1'), 'Helios Cloud & Edge v2.1');
    assert.equal(clampNumber(1.75, 0.1, 4.0, 1.0), 1.75);

    const validPayload = JSON.stringify({ products: SEED_PORTFOLIO });
    const result = validateAndParsePortfolioJson(validPayload);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.length, 4);
      assert.equal(result.data[0].name, 'Helios Cloud Core');
    }
  });

  // RED-PILL TESTS: Adversarial & malformed inputs
  it('Red-Pill: strips XSS script tags, event handlers, and javascript: URIs', () => {
    const xss = '<script>alert(1)</script>Core<img src=x onerror=alert(2)>';
    const cleaned = sanitizeText(xss);
    assert.equal(cleaned.includes('<script>'), false);
    assert.equal(cleaned.includes('onerror='), false);
    assert.equal(cleaned, 'alert(1)Core');

    const uri = 'javascript:alert(document.cookie)';
    assert.equal(sanitizeText(uri).includes('javascript:'), false);
  });

  it('Red-Pill: neutralizes prototype pollution keys (__proto__, constructor, prototype)', () => {
    const malicious = JSON.parse(
      '{"__proto__": {"polluted": true}, "constructor": {"x": 1}, "safe": "ok"}'
    );
    const stripped = stripDangerousKeys(malicious) as Record<string, unknown>;
    assert.equal(Object.prototype.hasOwnProperty.call(stripped, '__proto__'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(stripped, 'constructor'), false);
    assert.equal(stripped.safe, 'ok');
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
  });

  it('Red-Pill: rejects malformed JSON, invalid enums, and oversized payloads', () => {
    assert.equal(validateAndParsePortfolioJson('{bad json').ok, false);
    assert.equal(validateAndParsePortfolioJson('[]').ok, false);

    const invalidEnum = JSON.stringify([
      {
        name: 'Rogue',
        bcgQuadrant: 'invalid_quadrant',
        ansoffStrategy: 'market_penetration',
        resourceCap: { maxBudgetPct: 20, allocatedBudgetPct: 10, maxFte: 5, reviewCadence: 'Weekly' },
        okrs: [{ title: 'Obj', keyResults: [{ title: 'KR', metricUnit: '%', startValue: 0, targetValue: 10, currentValue: 5 }] }],
      },
    ]);
    assert.equal(validateAndParsePortfolioJson(invalidEnum).ok, false);

    const oversized = 'x'.repeat(260_000);
    assert.equal(validateAndParsePortfolioJson(oversized).ok, false);
  });

  it('Red-Pill: clamps out-of-bounds and NaN/Infinity numeric coordinates', () => {
    assert.equal(clampNumber(999, 0.1, 4.0, 1.0), 4.0);
    assert.equal(clampNumber(-50, 0, 40, 15), 0);
    assert.equal(clampNumber(Number.NaN, 0.1, 4.0, 1.0), 1.0);
    assert.equal(clampNumber(Number.POSITIVE_INFINITY, 0, 40, 15), 15);
  });
});
