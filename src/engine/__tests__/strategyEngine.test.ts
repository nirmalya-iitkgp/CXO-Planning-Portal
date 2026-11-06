import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SEED_PORTFOLIO,
  calculateKeyResultProgress,
  calculateObjectiveProgress,
  classifyBcgQuadrant,
  generateExecutionPlan,
  getAnsoffOptionsForQuadrant,
  getQuadrantTrend,
} from '../strategyEngine';

describe('Deterministic Strategy Engine', () => {
  it('classifies BCG quadrants accurately at boundary thresholds (1.0x share, 15% growth)', () => {
    assert.equal(classifyBcgQuadrant(1.0, 15), 'star');
    assert.equal(classifyBcgQuadrant(2.5, 30), 'star');
    assert.equal(classifyBcgQuadrant(0.99, 15), 'question_mark');
    assert.equal(classifyBcgQuadrant(0.4, 28), 'question_mark');
    assert.equal(classifyBcgQuadrant(1.0, 14.9), 'cash_cow');
    assert.equal(classifyBcgQuadrant(3.0, 5), 'cash_cow');
    assert.equal(classifyBcgQuadrant(0.5, 10), 'dog');
  });

  it('ranks Ansoff options with Primary Fit first for Question Marks and Stars', () => {
    const qmOptions = getAnsoffOptionsForQuadrant('question_mark');
    assert.equal(qmOptions.length, 4);
    assert.equal(qmOptions[0].fitRank, 'Primary Fit');
    assert.equal(qmOptions[0].strategy, 'market_penetration');

    const starOptions = getAnsoffOptionsForQuadrant('star');
    assert.equal(starOptions[0].fitRank, 'Primary Fit');
  });

  it('deterministically generates stricter resource caps for Dogs than Stars', () => {
    const starPlan = generateExecutionPlan(
      'Alpha',
      'star',
      'market_penetration',
      'Core Feature Velocity'
    );
    const dogPlan = generateExecutionPlan(
      'Omega',
      'dog',
      'market_penetration',
      'Margin & Cost Discipline'
    );

    assert.ok(starPlan.resourceCap.maxBudgetPct > dogPlan.resourceCap.maxBudgetPct);
    assert.ok(starPlan.resourceCap.maxFte > dogPlan.resourceCap.maxFte);
    assert.equal(starPlan.okrs.length, 2);
    assert.equal(dogPlan.okrs.length, 2);
  });

  it('calculates Key Result and Objective progress accurately', () => {
    const pct = calculateKeyResultProgress({
      startValue: 0,
      targetValue: 100,
      currentValue: 45,
    });
    assert.equal(pct, 45);

    const objPct = calculateObjectiveProgress({
      id: 'o1',
      title: 'Test Objective',
      keyResults: [
        { id: 'k1', title: 'KR1', metricUnit: '%', startValue: 0, targetValue: 100, currentValue: 50 },
        { id: 'k2', title: 'KR2', metricUnit: '%', startValue: 0, targetValue: 100, currentValue: 100 },
      ],
    });
    assert.equal(objPct, 75);
  });

  it('seeds a valid 4-product portfolio covering all 4 BCG quadrants', () => {
    const quadrants = new Set(SEED_PORTFOLIO.map((p) => p.bcgQuadrant));
    assert.equal(SEED_PORTFOLIO.length, 4);
    assert.equal(quadrants.size, 4);
  });

  it('computes quadrant trend direction against previousBcgQuadrant', () => {
    assert.equal(getQuadrantTrend('star', 'question_mark'), 'up');
    assert.equal(getQuadrantTrend('question_mark', 'dog'), 'up');
    assert.equal(getQuadrantTrend('dog', 'cash_cow'), 'down');
    assert.equal(getQuadrantTrend('question_mark', 'star'), 'down');
    assert.equal(getQuadrantTrend('star', 'star'), 'unchanged');
    assert.equal(getQuadrantTrend('star', undefined), 'unchanged');
  });
});
