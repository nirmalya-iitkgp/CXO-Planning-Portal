export type BcgQuadrant = 'star' | 'question_mark' | 'cash_cow' | 'dog';

export type AnsoffStrategy =
  | 'market_penetration'
  | 'market_development'
  | 'product_development'
  | 'diversification';

export type StrategicLever =
  | 'Core Feature Velocity'
  | 'Tiered Pricing & Packaging'
  | 'Geographic Expansion'
  | 'Adjacent Segment Entry'
  | 'Platform Modularization'
  | 'Margin & Cost Discipline'
  | 'Validation & Gatekeeping';

export type ReviewCadence = 'Weekly' | 'Bi-Weekly' | 'Monthly';

export interface KeyResult {
  id: string;
  title: string;
  metricUnit: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
}

export interface Objective {
  id: string;
  title: string;
  keyResults: KeyResult[];
}

export interface ResourceCap {
  maxBudgetPct: number;
  allocatedBudgetPct: number;
  maxFte: number;
  reviewCadence: ReviewCadence;
}

export interface ProductNode {
  id: string;
  name: string;
  owner: string;
  marketShare: number; // Relative market share: 0.1x to 4.0x (threshold 1.0x)
  marketGrowth: number; // Market growth rate %: 0 to 40 (threshold 15%)
  bcgQuadrant: BcgQuadrant;
  previousBcgQuadrant?: BcgQuadrant;
  ansoffStrategy: AnsoffStrategy;
  strategicLever: StrategicLever;
  resourceCap: ResourceCap;
  okrs: Objective[];
  updatedAt: string;
}

export interface AnsoffOption {
  strategy: AnsoffStrategy;
  label: string;
  fitRank: 'Primary Fit' | 'Secondary Fit' | 'Selective' | 'High Risk';
  tooltip: string;
  recommendedLevers: StrategicLever[];
}

export type WorkspaceView = 'portfolio' | 'execution' | 'caps';
