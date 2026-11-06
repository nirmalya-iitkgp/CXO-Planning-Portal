import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  ANSOFF_LABELS,
  BCG_META,
  calculateKeyResultProgress,
  calculateObjectiveProgress,
  calculateProductOkrProgress,
} from '../engine/strategyEngine';
import { BcgQuadrant, ProductNode } from '../types/strategy';
import { Tooltip } from './Tooltip';

interface ExecutionOkrViewProps {
  products: ProductNode[];
  onUpdateKeyResult: (productId: string, objectiveId: string, krId: string, value: number) => void;
  onOpenAnsoffWizard: (product: ProductNode) => void;
}

export function ExecutionOkrView({
  products,
  onUpdateKeyResult,
  onOpenAnsoffWizard,
}: ExecutionOkrViewProps) {
  const [quadrantFilter, setQuadrantFilter] = useState<'all' | BcgQuadrant>('all');
  const [query, setQuery] = useState('');

  const filtered = products.filter((p) => {
    const matchesQuad = quadrantFilter === 'all' || p.bcgQuadrant === quadrantFilter;
    const q = query.trim().toLowerCase();
    const matchesText =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q) ||
      ANSOFF_LABELS[p.ansoffStrategy].toLowerCase().includes(q);
    return matchesQuad && matchesText;
  });

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#FAFAFA] border border-slate-200 rounded-md">
          {(['all', 'star', 'question_mark', 'cash_cow', 'dog'] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuadrantFilter(q)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                quadrantFilter === q
                  ? 'bg-[#0F172A] text-white'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {q === 'all' ? 'All Quadrants' : BCG_META[q].label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter products or owners..."
            aria-label="Filter products or owners"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFAFA] border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>
      </div>

      {/* Product OKR List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500">
          No products match the current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => {
            const overallPct = calculateProductOkrProgress(product);
            return (
              <section
                key={product.id}
                className="bg-white border border-slate-200 rounded-lg p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{BCG_META[product.bcgQuadrant].label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ANSOFF_LABELS[product.ansoffStrategy]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.strategicLever}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.owner}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Completion</div>
                      <div className="text-base font-mono tabular-nums font-bold text-[#1D4ED8]">
                        {overallPct}%
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenAnsoffWizard(product)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-[#0F172A] border border-slate-200 hover:border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Re-align
                    </button>
                  </div>
                </div>

                {/* Objectives & Key Results */}
                <div className="divide-y divide-slate-100">
                  {product.okrs.map((obj, idx) => {
                    const objPct = calculateObjectiveProgress(obj);
                    return (
                      <div key={obj.id} className="py-4 first:pt-4 last:pb-0">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono tabular-nums text-slate-400">
                              O{idx + 1}
                            </span>
                            <h4 className="text-sm font-semibold text-[#0F172A]">
                              {obj.title}
                            </h4>
                          </div>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                            {objPct}%
                          </span>
                        </div>

                        <div className="space-y-3 pl-6">
                          {obj.keyResults.map((kr) => {
                            const krPct = calculateKeyResultProgress(kr);
                            return (
                              <div
                                key={kr.id}
                                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                              >
                                <div className="md:col-span-6 text-slate-700 flex items-center gap-1.5">
                                  <span>{kr.title}</span>
                                  <Tooltip
                                    content={`Baseline: ${kr.startValue} ${kr.metricUnit} → Target: ${kr.targetValue} ${kr.metricUnit}`}
                                  />
                                </div>

                                <div className="md:col-span-4 flex items-center gap-3">
                                  <input
                                    type="range"
                                    min={kr.startValue}
                                    max={kr.targetValue}
                                    step={kr.targetValue - kr.startValue <= 15 ? 1 : 1}
                                    value={kr.currentValue}
                                    aria-label={kr.title}
                                    onChange={(e) =>
                                      onUpdateKeyResult(
                                        product.id,
                                        obj.id,
                                        kr.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full accent-[#1D4ED8] cursor-pointer"
                                  />
                                </div>

                                <div className="md:col-span-2 text-right font-mono tabular-nums text-slate-700">
                                  {kr.currentValue} / {kr.targetValue} {kr.metricUnit}{' '}
                                  <span className="text-slate-400">({krPct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
