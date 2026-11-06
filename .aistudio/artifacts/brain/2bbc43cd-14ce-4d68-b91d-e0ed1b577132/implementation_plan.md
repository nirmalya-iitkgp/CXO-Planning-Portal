# Cadence Bridge — Strategy-to-Execution Workspace

An interactive strategy workspace that connects portfolio analysis (BCG Matrix), growth strategy selection (Ansoff Matrix), and team execution (OKRs and resource allocation caps) into a continuous, deterministic pipeline.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All core product decisions below reflect your Phase 1 selections. Please review and approve to begin implementation.

- **Confirmed Decision 1 — Deterministic Rule-Based Engine**: Portfolio placement in the BCG Matrix automatically triggers a tailored Ansoff growth wizard and deterministically generates team OKRs and resource allocation caps without any AI/LLM calls.
- **Confirmed Decision 2 — Local Persistence & Portability**: All portfolios, product placements, Ansoff selections, and OKR progress are persisted in browser `localStorage` with one-click JSON export and validated JSON import.
- **Confirmed Decision 3 — Expressive Minimalism / Clean Executive Canvas**: High-clarity daylight canvas with only essential text on screen; contextual guidance and framework definitions are tucked into interactive hover/focus tooltips.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates "strategy shelf-ware" by enforcing a live, automated link between where a product sits in the market and what teams execute each quarter:
  1. **BCG Portfolio Matrix**: Plot or drag/move products across *Stars*, *Question Marks*, *Cash Cows*, and *Dogs* based on Relative Market Share and Market Growth Rate.
  2. **Triggered Ansoff Growth Wizard**: Placing or moving a product—especially into *Question Marks* or *Stars*—automatically opens a focused Ansoff Growth Wizard (*Market Penetration*, *Market Development*, *Product Development*, *Diversification*) with quadrant-specific strategic fit guidance.
  3. **Automated OKRs & Resource Caps**: Completing the Ansoff selection deterministically generates calibrated team Objectives, Key Results with measurable targets, and explicit resource allocation caps (budget % ceiling, headcount/FTE cap, and governance cadence) that teams can track and update.
- **Target Audience**: Product leaders, strategy teams, and operational leads who need portfolio decisions to translate immediately into quarterly team execution.
- **Key Value**: Replaces disconnected slide decks and spreadsheets with a single, auditable pipeline from portfolio theory to weekly key-result tracking.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Portfolio Canvas (Default View)**:
   - Opens to a pre-seeded, realistic multi-product portfolio (e.g., 4 products across quadrants) so the pipeline is immediately demonstrable, alongside an **Add Product** action and **Reset / Import / Export JSON** controls.
   - Products appear as interactive nodes on a 2×2 BCG Matrix (Relative Market Share on X-axis, Market Growth Rate on Y-axis) with subtle quadrant watermarks and tooltip-driven definitions.
   - Clicking any product node or dragging/repositioning it into a new quadrant (such as *Question Mark* or *Star*) immediately highlights the transition and triggers the **Ansoff Growth Wizard** drawer/modal.
2. **Ansoff Growth Selection Wizard**:
   - Displays the product's current BCG quadrant, market metrics, and the 4 Ansoff growth vectors ranked by deterministic strategic fit for that BCG quadrant (e.g., *Question Marks* emphasize *Market Penetration* or *Product Development* with strict validation gates; *Stars* emphasize *Market Penetration* and *Market Development* to defend share).
   - Users select a growth vector, choose a primary strategic lever (e.g., *Geographic Expansion*, *Tiered Pricing*, *Core Feature Velocity*), and confirm.
3. **Execution & Resource Cap Ledger**:
   - Immediately updates the product's linked **Team OKRs** and **Resource Allocation Caps** in the execution panel.
   - Users can adjust Key Result progress sliders/inputs, toggle milestone completion, inspect resource cap utilization (Budget %, FTE Cap, Review Cadence), and filter execution items by BCG quadrant or Ansoff strategy.

### Visual Identity & Theme
- **Aesthetic Direction**: Expressive Minimalism / Clean Executive Canvas — restrained, editorial-grade clarity with zero decorative clutter, zero-pill metadata (clean typographic `·` separators), and all explanatory instructions housed in accessible tooltips (`?` triggers).
- **Color Palette & Mood (60-30-10 Daylight Discipline)**:
  - *60% Dominant Neutral Canvas*: Crisp warm-neutral alabaster (`#FAFAFA`) background.
  - *30% Structural Surfaces*: Pure white (`#FFFFFF`) single-elevation surfaces with hairline `1px` slate borders (`#E2E8F0`) and deep slate typography (`#0F172A` primary, `#475569` secondary).
  - *10% Accent & Semantic State*: Deep Cobalt (`#1D4ED8`) for primary actions and active selections; semantic status colors paired with explicit text labels (Emerald `#16A34A` for On Track, Amber `#D97706` for At Risk, Crimson `#DC2626` for Cap Exceeded / Behind).
- **Typography & Hierarchy**:
  - *Display & UI*: `Plus Jakarta Sans` (weights 500, 600, 700) with `text-wrap: balance` on headings.
  - *Data & Telemetry*: `JetBrains Mono` with `font-variant-numeric: tabular-nums` for market share, growth %, budget caps, and OKR progress.
- **Top Bar Contract**:
  - Single-row header with 3 zones: Brand wordmark (`Cadence Bridge`) on the left, 3 concise view links (`Portfolio Matrix`, `Execution & OKRs`, `Resource Caps`) in the center, and 1 primary action (`+ New Product`) on the right.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Deterministic Rule Engine over AI Generation**:
  - *Chosen Approach*: A pure, transparent TypeScript rule matrix mapping `(BCG Quadrant × Ansoff Strategy × Strategic Lever)` to calibrated OKR templates and resource cap formulas.
  - *Why*: Guarantees instant (<10ms) responses, 100% reproducible outputs, zero API key requirements, and full unit-testability.
  - *Alternatives Considered*: LLM-based generation, which introduces latency, non-determinism, and external API dependencies.
- **Decision 2 — Client-Side `localStorage` with Validated JSON Export/Import**:
  - *Chosen Approach*: Persist workspace state automatically in `localStorage` under a versioned key, paired with JSON export and strict schema-validated JSON import.
  - *Why*: Zero-friction startup with full data portability and offline resilience.
  - *Alternatives Considered*: Backend database, which adds unnecessary infrastructure for a single-workspace strategy tool.
- **Decision 3 — Tooltip-First Minimalism**:
  - *Chosen Approach*: Keep the canvas free of instructional paragraphs; surface framework rules (BCG thresholds, Ansoff risk profiles, cap formulas) via hover/focus tooltips.
  - *Why*: Preserves executive scan speed while keeping domain guidance one hover away.

---

## 4. Technical Architecture & Data Strategy

### System & Component Architecture
```
┌──────────────────────────────────────────────────────────────────────┐
│                         Top Navigation Bar                           │
│  [Cadence Bridge]    [Portfolio · Execution · Caps]   [+ New Product]│
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  BCG Matrix View  │     │ Ansoff Wizard     │     │ Execution & Caps  │
│  - 2x2 Interactive│────▶│ - Triggered on    │────▶│ - Generated OKRs  │
│    Plot & Drag    │     │   BCG placement   │     │ - Budget/FTE Caps │
│  - Tooltip Guides │     │ - Fit & Lever     │     │ - Progress Inputs │
└─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘
          │                         │                           │
          └─────────────────────────┼───────────────────────────┘
                                    ▼
                    ┌───────────────────────────────┐
                    │  Deterministic Strategy Engine │
                    │  BCG -> Ansoff -> OKRs & Caps │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Validated Storage & Security │
                    │  localStorage + JSON I/O      │
                    │  Input Sanitization & Guards  │
                    └───────────────────────────────┘
```

### Data Model & State
- **ProductNode**: `id`, `name`, `owner`, `marketShare` (relative, e.g., `0.1x`–`4.0x`), `marketGrowth` (`0%`–`40%`), `bcgQuadrant` (`star` | `question_mark` | `cash_cow` | `dog`), `ansoffStrategy` (`market_penetration` | `market_development` | `product_development` | `diversification`), `strategicLever`, `resourceCap` (`maxBudgetPct`, `maxFte`, `reviewCadence`, `allocatedBudgetPct`), and `okrs` (`Objective[]` with `KeyResult[]`).
- **Interactive State Mapping**:
  - Dragging or editing a product's `marketShare` / `marketGrowth` recalculates its `bcgQuadrant` (threshold: `1.0x` relative share, `15%` market growth) and automatically opens the Ansoff Growth Wizard if the quadrant changed.
  - Confirming an Ansoff selection invokes the deterministic engine to regenerate the product's `okrs` and `resourceCap` while preserving custom product metadata.
  - Updating Key Result `currentValue` or `allocatedBudgetPct` immediately recalculates objective completion % and cap compliance status.

### Security & Verification Strategy
- **Input & Import Hardening**: Strict string sanitization (stripping HTML/script tags, enforcing length bounds) on all user-entered product/OKR text, plus strict runtime schema validation and prototype-pollution guards (`__proto__`, `constructor`, `prototype` stripping) on JSON import and `localStorage` hydration.
- **Automated Unit Tests & Red-Pill / Blue-Pill Security Tests**:
  - Unit tests covering BCG quadrant classification boundaries, deterministic Ansoff-to-OKR/cap generation, and progress/cap calculations.
  - Security tests (Red-Pill / Blue-Pill) verifying that malicious JSON payloads (XSS strings, oversized arrays, prototype pollution keys, invalid numeric bounds) are safely rejected or neutralized while valid payloads succeed.
