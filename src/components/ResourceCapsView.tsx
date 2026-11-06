import { ANSOFF_LABELS, BCG_META } from '../engine/strategyEngine';
import { ProductNode } from '../types/strategy';
import { Tooltip } from './Tooltip';

interface ResourceCapsViewProps {
  products: ProductNode[];
  onUpdateAllocatedBudget: (productId: string, allocatedPct: number) => void;
}

export function ResourceCapsView({
  products,
  onUpdateAllocatedBudget,
}: ResourceCapsViewProps) {
  const totalAllocated = products.reduce(
    (sum, p) => sum + p.resourceCap.allocatedBudgetPct,
    0
  );
  const totalMaxCap = products.reduce((sum, p) => sum + p.resourceCap.maxBudgetPct, 0);
  const totalFte = products.reduce((sum, p) => sum + p.resourceCap.maxFte, 0);
  const breaches = products.filter(
    (p) => p.resourceCap.allocatedBudgetPct > p.resourceCap.maxBudgetPct
  ).length;

  return (
    <div className="space-y-6">
      {/* 4-Column Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Allocated Portfolio Budget</div>
          <div
            className={`text-2xl font-mono tabular-nums font-bold mt-1 ${
              totalAllocated > 100 ? 'text-[#DC2626]' : 'text-[#0F172A]'
            }`}
          >
            {totalAllocated}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Aggregate Cap Ceiling</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-[#0F172A] mt-1">
            {totalMaxCap}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Authorized Headcount</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-[#0F172A] mt-1">
            {totalFte} FTE
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Cap Breaches</div>
          <div
            className={`text-2xl font-mono tabular-nums font-bold mt-1 ${
              breaches > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'
            }`}
          >
            {breaches}
          </div>
        </div>
      </div>

      {/* Resource Cap Governance Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Resource Allocation Caps
            </h2>
            <Tooltip
              align="left"
              content="Caps are deterministically derived from each product's BCG quadrant and Ansoff growth vector to prevent over-investing in low-share or mature bets."
            />
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {products.length} Active Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-[#FAFAFA]">
                <th className="py-3 px-6">Product</th>
                <th className="py-3 px-4">BCG · Ansoff</th>
                <th className="py-3 px-4 text-right">FTE Cap</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4">Allocated Budget</th>
                <th className="py-3 px-4 text-right">Max Cap</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {products.map((p) => {
                const { allocatedBudgetPct, maxBudgetPct, maxFte, reviewCadence } =
                  p.resourceCap;
                const isExceeded = allocatedBudgetPct > maxBudgetPct;
                const isNear = !isExceeded && allocatedBudgetPct >= maxBudgetPct * 0.9;

                return (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#0F172A]">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {BCG_META[p.bcgQuadrant].label} · {ANSOFF_LABELS[p.ansoffStrategy]}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A]">
                      {maxFte}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{reviewCadence}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 max-w-[180px]">
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={1}
                          value={allocatedBudgetPct}
                          aria-label={`Allocated budget for ${p.name}`}
                          onChange={(e) =>
                            onUpdateAllocatedBudget(p.id, Number(e.target.value))
                          }
                          className="w-full accent-[#1D4ED8] cursor-pointer"
                        />
                        <span className="font-mono tabular-nums font-semibold text-[#0F172A] w-10 text-right">
                          {allocatedBudgetPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {maxBudgetPct}%
                    </td>
                    <td className="py-3.5 px-6 text-right font-medium">
                      <span
                        className={
                          isExceeded
                            ? 'text-[#DC2626]'
                            : isNear
                              ? 'text-[#D97706]'
                              : 'text-[#16A34A]'
                        }
                      >
                        {isExceeded
                          ? 'Cap Exceeded'
                          : isNear
                            ? 'Near Ceiling'
                            : 'Within Cap'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
