import {
  AnsoffOption,
  AnsoffStrategy,
  BcgQuadrant,
  Objective,
  ProductNode,
  ResourceCap,
  StrategicLever,
} from '../types/strategy';

export const BCG_THRESHOLDS = {
  share: 1.0, // >= 1.0x = High Relative Market Share
  growth: 15, // >= 15% = High Market Growth Rate
} as const;

export const BCG_META: Record<
  BcgQuadrant,
  { label: string; shortTag: string; tooltip: string }
> = {
  star: {
    label: 'Star',
    shortTag: 'High Share · High Growth',
    tooltip:
      'Market leaders in fast-growing segments (Share >= 1.0x, Growth >= 15%). Require heavy reinvestment to defend share and scale.',
  },
  question_mark: {
    label: 'Question Mark',
    shortTag: 'Low Share · High Growth',
    tooltip:
      'High-growth contenders with low share (Share < 1.0x, Growth >= 15%). Require strict validation gates before scaling capital.',
  },
  cash_cow: {
    label: 'Cash Cow',
    shortTag: 'High Share · Low Growth',
    tooltip:
      'Mature market leaders (Share >= 1.0x, Growth < 15%). Focus on margin discipline and harvesting cash to fund Stars and Question Marks.',
  },
  dog: {
    label: 'Dog',
    shortTag: 'Low Share · Low Growth',
    tooltip:
      'Low-share products in mature markets (Share < 1.0x, Growth < 15%). Cap resource allocation strictly and focus on niche retention or sunsetting.',
  },
};

export const ANSOFF_LABELS: Record<AnsoffStrategy, string> = {
  market_penetration: 'Market Penetration',
  market_development: 'Market Development',
  product_development: 'Product Development',
  diversification: 'Diversification',
};

/**
 * Deterministically classifies a product into a BCG Quadrant.
 */
export function classifyBcgQuadrant(marketShare: number, marketGrowth: number): BcgQuadrant {
  const highShare = marketShare >= BCG_THRESHOLDS.share;
  const highGrowth = marketGrowth >= BCG_THRESHOLDS.growth;
  if (highShare && highGrowth) return 'star';
  if (!highShare && highGrowth) return 'question_mark';
  if (highShare && !highGrowth) return 'cash_cow';
  return 'dog';
}

const QUADRANT_STRENGTH: Record<BcgQuadrant, number> = {
  dog: 1,
  question_mark: 2,
  cash_cow: 3,
  star: 4,
};

/**
 * Compares current BCG quadrant against previousBcgQuadrant.
 */
export function getQuadrantTrend(
  current: BcgQuadrant,
  previous?: BcgQuadrant
): 'up' | 'down' | 'unchanged' {
  if (!previous || previous === current) return 'unchanged';
  return QUADRANT_STRENGTH[current] > QUADRANT_STRENGTH[previous] ? 'up' : 'down';
}

/**
 * Returns ranked Ansoff growth options tailored to the product's BCG Quadrant.
 */
export function getAnsoffOptionsForQuadrant(quadrant: BcgQuadrant): AnsoffOption[] {
  const catalog: Record<BcgQuadrant, AnsoffOption[]> = {
    question_mark: [
      {
        strategy: 'market_penetration',
        label: 'Market Penetration',
        fitRank: 'Primary Fit',
        tooltip: 'Capture share in existing high-growth segment before competitors consolidate.',
        recommendedLevers: ['Validation & Gatekeeping', 'Tiered Pricing & Packaging'],
      },
      {
        strategy: 'product_development',
        label: 'Product Development',
        fitRank: 'Secondary Fit',
        tooltip: 'Resolve product-market fit gaps with targeted capabilities for core buyers.',
        recommendedLevers: ['Core Feature Velocity', 'Validation & Gatekeeping'],
      },
      {
        strategy: 'market_development',
        label: 'Market Development',
        fitRank: 'Selective',
        tooltip: 'Test adjacent verticals only if core segment acquisition cost is validated.',
        recommendedLevers: ['Adjacent Segment Entry', 'Geographic Expansion'],
      },
      {
        strategy: 'diversification',
        label: 'Diversification',
        fitRank: 'High Risk',
        tooltip: 'Avoid unvalidated new-market + new-product bets while core share is < 1.0x.',
        recommendedLevers: ['Platform Modularization'],
      },
    ],
    star: [
      {
        strategy: 'market_penetration',
        label: 'Market Penetration',
        fitRank: 'Primary Fit',
        tooltip: 'Defend leadership and compound share while category growth remains >= 15%.',
        recommendedLevers: ['Core Feature Velocity', 'Tiered Pricing & Packaging'],
      },
      {
        strategy: 'market_development',
        label: 'Market Development',
        fitRank: 'Primary Fit',
        tooltip: 'Expand into new geographies and enterprise tiers from a position of strength.',
        recommendedLevers: ['Geographic Expansion', 'Adjacent Segment Entry'],
      },
      {
        strategy: 'product_development',
        label: 'Product Development',
        fitRank: 'Secondary Fit',
        tooltip: 'Launch adjacent modules to increase net revenue retention among existing accounts.',
        recommendedLevers: ['Platform Modularization', 'Core Feature Velocity'],
      },
      {
        strategy: 'diversification',
        label: 'Diversification',
        fitRank: 'Selective',
        tooltip: 'Seed next-horizon bets using excess Star momentum with capped R&D allocation.',
        recommendedLevers: ['Platform Modularization'],
      },
    ],
    cash_cow: [
      {
        strategy: 'market_penetration',
        label: 'Market Penetration',
        fitRank: 'Primary Fit',
        tooltip: 'Maximize renewal, pricing power, and gross margin in established core.',
        recommendedLevers: ['Margin & Cost Discipline', 'Tiered Pricing & Packaging'],
      },
      {
        strategy: 'product_development',
        label: 'Product Development',
        fitRank: 'Secondary Fit',
        tooltip: 'Low-risk add-ons that protectinstalled base without heavy capital burn.',
        recommendedLevers: ['Platform Modularization', 'Margin & Cost Discipline'],
      },
      {
        strategy: 'market_development',
        label: 'Market Development',
        fitRank: 'Selective',
        tooltip: 'Opportunistic channel expansion with strict payback-period caps.',
        recommendedLevers: ['Adjacent Segment Entry'],
      },
      {
        strategy: 'diversification',
        label: 'Diversification',
        fitRank: 'High Risk',
        tooltip: 'High capital risk; only pursue via spun-out Question Mark initiatives.',
        recommendedLevers: ['Validation & Gatekeeping'],
      },
    ],
    dog: [
      {
        strategy: 'market_penetration',
        label: 'Market Penetration',
        fitRank: 'Primary Fit',
        tooltip: 'Narrow focus to profitable niche retention while capping engineering spend.',
        recommendedLevers: ['Margin & Cost Discipline', 'Validation & Gatekeeping'],
      },
      {
        strategy: 'market_development',
        label: 'Market Development',
        fitRank: 'Selective',
        tooltip: 'Reposition existing asset into low-competition regional or vertical niches.',
        recommendedLevers: ['Adjacent Segment Entry'],
      },
      {
        strategy: 'product_development',
        label: 'Product Development',
        fitRank: 'High Risk',
        tooltip: 'Avoid heavy R&D reinvestment unless a clear pivot gate is met.',
        recommendedLevers: ['Validation & Gatekeeping'],
      },
      {
        strategy: 'diversification',
        label: 'Diversification',
        fitRank: 'High Risk',
        tooltip: 'Not recommended; reallocate capital toward Stars and Question Marks.',
        recommendedLevers: ['Margin & Cost Discipline'],
      },
    ],
  };

  return catalog[quadrant];
}

/**
 * Deterministically generates Resource Allocation Caps and Team OKRs
 * from (Product, BCG Quadrant, Ansoff Strategy, Strategic Lever).
 */
export function generateExecutionPlan(
  productName: string,
  quadrant: BcgQuadrant,
  ansoff: AnsoffStrategy,
  lever: StrategicLever
): { resourceCap: ResourceCap; okrs: Objective[] } {
  const capMatrix: Record<BcgQuadrant, Record<AnsoffStrategy, Omit<ResourceCap, 'allocatedBudgetPct'>>> = {
    star: {
      market_penetration: { maxBudgetPct: 40, maxFte: 28, reviewCadence: 'Bi-Weekly' },
      market_development: { maxBudgetPct: 38, maxFte: 24, reviewCadence: 'Bi-Weekly' },
      product_development: { maxBudgetPct: 35, maxFte: 22, reviewCadence: 'Bi-Weekly' },
      diversification: { maxBudgetPct: 25, maxFte: 14, reviewCadence: 'Weekly' },
    },
    question_mark: {
      market_penetration: { maxBudgetPct: 28, maxFte: 14, reviewCadence: 'Weekly' },
      product_development: { maxBudgetPct: 25, maxFte: 12, reviewCadence: 'Weekly' },
      market_development: { maxBudgetPct: 20, maxFte: 10, reviewCadence: 'Weekly' },
      diversification: { maxBudgetPct: 12, maxFte: 6, reviewCadence: 'Weekly' },
    },
    cash_cow: {
      market_penetration: { maxBudgetPct: 18, maxFte: 12, reviewCadence: 'Monthly' },
      product_development: { maxBudgetPct: 16, maxFte: 10, reviewCadence: 'Monthly' },
      market_development: { maxBudgetPct: 15, maxFte: 8, reviewCadence: 'Bi-Weekly' },
      diversification: { maxBudgetPct: 10, maxFte: 5, reviewCadence: 'Bi-Weekly' },
    },
    dog: {
      market_penetration: { maxBudgetPct: 8, maxFte: 4, reviewCadence: 'Monthly' },
      market_development: { maxBudgetPct: 8, maxFte: 4, reviewCadence: 'Bi-Weekly' },
      product_development: { maxBudgetPct: 6, maxFte: 3, reviewCadence: 'Weekly' },
      diversification: { maxBudgetPct: 5, maxFte: 2, reviewCadence: 'Weekly' },
    },
  };

  const baseCap = capMatrix[quadrant][ansoff];
  const resourceCap: ResourceCap = {
    ...baseCap,
    allocatedBudgetPct: Math.max(4, Math.round(baseCap.maxBudgetPct * 0.85)),
  };

  const ansoffTitle = ANSOFF_LABELS[ansoff];
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 18) || 'prod';

  const okrs: Objective[] = [
    {
      id: `${slug}-obj-1`,
      title: `Execute ${ansoffTitle} for ${productName} via ${lever}`,
      keyResults: [
        {
          id: `${slug}-kr-1`,
          title:
            ansoff === 'market_penetration'
              ? 'Increase active segment market share'
              : ansoff === 'market_development'
                ? 'Launch qualified pipeline in target expansion segment'
                : ansoff === 'product_development'
                  ? 'Ship core capability milestones on schedule'
                  : 'Validate new-market prototype with design partners',
          metricUnit: '%',
          startValue: 0,
          targetValue: quadrant === 'star' ? 35 : quadrant === 'question_mark' ? 25 : 15,
          currentValue: quadrant === 'star' ? 12 : 6,
        },
        {
          id: `${slug}-kr-2`,
          title:
            quadrant === 'question_mark'
              ? 'Pass stage-gate unit economics & retention threshold'
              : quadrant === 'cash_cow'
                ? 'Maintain net dollar retention above target floor'
                : 'Achieve quarterly qualified conversion rate',
          metricUnit: '%',
          startValue: 60,
          targetValue: quadrant === 'cash_cow' ? 95 : 85,
          currentValue: quadrant === 'cash_cow' ? 88 : 70,
        },
      ],
    },
    {
      id: `${slug}-obj-2`,
      title: `Enforce ${BCG_META[quadrant].label} capital discipline & ${baseCap.reviewCadence.toLowerCase()} cadence`,
      keyResults: [
        {
          id: `${slug}-kr-3`,
          title: `Keep quarterly burn within ${baseCap.maxBudgetPct}% portfolio budget ceiling`,
          metricUnit: '%',
          startValue: 0,
          targetValue: 100,
          currentValue: 85,
        },
        {
          id: `${slug}-kr-4`,
          title: `Complete ${baseCap.reviewCadence.toLowerCase()} execution reviews with ${baseCap.maxFte} FTE cap`,
          metricUnit: 'reviews',
          startValue: 0,
          targetValue: baseCap.reviewCadence === 'Weekly' ? 12 : baseCap.reviewCadence === 'Bi-Weekly' ? 6 : 3,
          currentValue: baseCap.reviewCadence === 'Weekly' ? 4 : 2,
        },
      ],
    },
  ];

  return { resourceCap, okrs };
}

export function calculateKeyResultProgress(kr: {
  startValue: number;
  targetValue: number;
  currentValue: number;
}): number {
  const span = kr.targetValue - kr.startValue;
  if (span === 0) return 100;
  const raw = ((kr.currentValue - kr.startValue) / span) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function calculateObjectiveProgress(obj: Objective): number {
  if (obj.keyResults.length === 0) return 0;
  const total = obj.keyResults.reduce((acc, kr) => acc + calculateKeyResultProgress(kr), 0);
  return Math.round(total / obj.keyResults.length);
}

export function calculateProductOkrProgress(product: ProductNode): number {
  if (product.okrs.length === 0) return 0;
  const total = product.okrs.reduce((acc, obj) => acc + calculateObjectiveProgress(obj), 0);
  return Math.round(total / product.okrs.length);
}

function buildSeedProduct(
  id: string,
  name: string,
  owner: string,
  marketShare: number,
  marketGrowth: number,
  ansoffStrategy: AnsoffStrategy,
  strategicLever: StrategicLever,
  previousBcgQuadrant?: BcgQuadrant
): ProductNode {
  const bcgQuadrant = classifyBcgQuadrant(marketShare, marketGrowth);
  const { resourceCap, okrs } = generateExecutionPlan(
    name,
    bcgQuadrant,
    ansoffStrategy,
    strategicLever
  );
  return {
    id,
    name,
    owner,
    marketShare,
    marketGrowth,
    bcgQuadrant,
    ...(previousBcgQuadrant ? { previousBcgQuadrant } : {}),
    ansoffStrategy,
    strategicLever,
    resourceCap,
    okrs,
    updatedAt: '2026-11-04T00:00:00.000Z',
  };
}

export const SEED_PORTFOLIO: ProductNode[] = [
  buildSeedProduct(
    'prod-helios',
    'Helios Cloud Core',
    'Elena Vance',
    2.4,
    28,
    'market_development',
    'Geographic Expansion',
    'question_mark'
  ),
  buildSeedProduct(
    'prod-pulse',
    'Pulse Edge Telemetry',
    'Marcus Chen',
    0.55,
    31,
    'market_penetration',
    'Validation & Gatekeeping'
  ),
  buildSeedProduct(
    'prod-ledger',
    'LedgerVault Classic',
    'Priya Nair',
    2.8,
    7,
    'market_penetration',
    'Margin & Cost Discipline'
  ),
  buildSeedProduct(
    'prod-printsync',
    'PrintSync Legacy',
    'David Ross',
    0.4,
    5,
    'market_penetration',
    'Margin & Cost Discipline',
    'cash_cow'
  ),
];
