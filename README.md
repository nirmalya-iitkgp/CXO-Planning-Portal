# Cadence Bridge — Strategy-to-Execution Workspace

**Cadence Bridge** is an interactive strategy-to-execution workspace that eliminates "strategy shelf-ware" by linking **BCG Matrix** portfolio placement, **Ansoff Matrix** growth strategy selection, and **Team OKRs & Resource Allocation Caps** into a continuous, deterministic pipeline.

---

## Core Pipeline

1. **BCG Portfolio Matrix (`Portfolio Matrix`)**
   - Plot and drag products across **Stars** (`Share >= 1.0x`, `Growth >= 15%`), **Question Marks** (`Share < 1.0x`, `Growth >= 15%`), **Cash Cows** (`Share >= 1.0x`, `Growth < 15%`), and **Dogs** (`Share < 1.0x`, `Growth < 15%`).
   - Moving a product into a new BCG quadrant—or adding a new product—automatically triggers the **Ansoff Growth Wizard**.

2. **Ansoff Growth Selection Wizard**
   - Deterministically ranks the four Ansoff growth vectors (*Market Penetration*, *Market Development*, *Product Development*, *Diversification*) by strategic fit for the product's current BCG quadrant.
   - Pairs the selected vector with an execution lever (e.g., *Validation & Gatekeeping*, *Core Feature Velocity*, *Geographic Expansion*, *Margin & Cost Discipline*).

3. **Automated Team OKRs & Resource Allocation Caps (`Execution & OKRs`, `Resource Caps`)**
   - Generates calibrated **Objectives & Key Results** with measurable targets and interactive progress sliders.
   - Enforces deterministic **Resource Allocation Caps** (Max Portfolio Budget %, Authorized FTE Cap, and Review Cadence) with live breach detection (`Within Cap`, `Near Ceiling`, `Cap Exceeded`).

4. **Local Persistence & Validated JSON Portability**
   - Automatically saves workspace state to browser `localStorage`.
   - Supports one-click JSON export and schema-validated JSON import.

---

## Architecture & Security

- **Zero-AI Deterministic Engine**: All BCG classifications, Ansoff fit rankings, OKR templates, and resource caps are computed deterministically in TypeScript (`src/engine/strategyEngine.ts`).
- **Input & Import Hardening (`src/security/sanitizer.ts`)**:
  - Strips HTML/script tags, `javascript:`/`data:` URIs, inline event handlers, and control characters from all text inputs.
  - Clamps all numeric coordinates and percentages to safe finite bounds.
  - Protects JSON imports against prototype pollution (`__proto__`, `constructor`, `prototype`), oversized payloads (>250KB), and invalid schema enums.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Run unit & Red-Pill/Blue-Pill security tests
npm test

# Lint & production build
npm run lint
npm run build
```
