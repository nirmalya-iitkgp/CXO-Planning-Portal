import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  BCG_META,
  generateExecutionPlan,
  getAnsoffOptionsForQuadrant,
} from '../engine/strategyEngine';
import { AnsoffStrategy, ProductNode, StrategicLever } from '../types/strategy';
import { Tooltip } from './Tooltip';

interface AnsoffWizardModalProps {
  product: ProductNode | null;
  onClose: () => void;
  onApply: (productId: string, ansoff: AnsoffStrategy, lever: StrategicLever) => void;
}

export function AnsoffWizardModal({ product, onClose, onApply }: AnsoffWizardModalProps) {
  const options = product ? getAnsoffOptionsForQuadrant(product.bcgQuadrant) : [];
  const [selectedStrategy, setSelectedStrategy] = useState<AnsoffStrategy>('market_penetration');
  const [selectedLever, setSelectedLever] = useState<StrategicLever>('Core Feature Velocity');

  useEffect(() => {
    if (!product) return;
    const opts = getAnsoffOptionsForQuadrant(product.bcgQuadrant);
    const best = opts[0];
    setSelectedStrategy(product.ansoffStrategy || best.strategy);
    const matchingOpt = opts.find((o) => o.strategy === product.ansoffStrategy) ?? best;
    setSelectedLever(
      matchingOpt.recommendedLevers.includes(product.strategicLever)
        ? product.strategicLever
        : matchingOpt.recommendedLevers[0]
    );
  }, [product]);

  if (!product) return null;

  const activeOption = options.find((o) => o.strategy === selectedStrategy) ?? options[0];
  const preview = generateExecutionPlan(
    product.name,
    product.bcgQuadrant,
    selectedStrategy,
    selectedLever
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ansoff-wizard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500">
              BCG Quadrant: {BCG_META[product.bcgQuadrant].label} · {BCG_META[product.bcgQuadrant].shortTag}
            </div>
            <h2 id="ansoff-wizard-title" className="text-lg font-bold text-[#0F172A] mt-0.5">
              Ansoff Growth Wizard — {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wizard"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Select Ansoff Vector */}
        <div className="py-4 border-b border-slate-200">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-semibold text-[#0F172A]">
              01. Select Growth Vector
            </span>
            <Tooltip content="Vectors are ranked deterministically based on your product's current BCG quadrant." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt) => {
              const active = opt.strategy === selectedStrategy;
              return (
                <button
                  key={opt.strategy}
                  type="button"
                  onClick={() => {
                    setSelectedStrategy(opt.strategy);
                    setSelectedLever(opt.recommendedLevers[0]);
                  }}
                  className={`p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.04]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#0F172A]">{opt.label}</span>
                    <span
                      className={`text-[11px] font-medium ${
                        opt.fitRank === 'Primary Fit'
                          ? 'text-[#16A34A]'
                          : opt.fitRank === 'High Risk'
                            ? 'text-[#DC2626]'
                            : 'text-slate-500'
                      }`}
                    >
                      {opt.fitRank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.tooltip}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Strategic Lever */}
        <div className="py-4 border-b border-slate-200">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs font-semibold text-[#0F172A]">
              02. Primary Execution Lever
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeOption.recommendedLevers.map((lever) => {
              const active = lever === selectedLever;
              return (
                <button
                  key={lever}
                  type="button"
                  onClick={() => setSelectedLever(lever)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {lever}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Deterministic Output Preview */}
        <div className="py-4">
          <div className="text-xs font-semibold text-[#0F172A] mb-2.5">
            03. Generated Resource Cap &amp; Team OKRs
          </div>
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-md p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs pb-3 border-b border-slate-200">
              <span>
                Max Budget:{' '}
                <strong className="font-mono tabular-nums text-[#0F172A]">
                  {preview.resourceCap.maxBudgetPct}%
                </strong>
              </span>
              <span>
                Headcount Cap:{' '}
                <strong className="font-mono tabular-nums text-[#0F172A]">
                  {preview.resourceCap.maxFte} FTE
                </strong>
              </span>
              <span>
                Cadence:{' '}
                <strong className="text-[#0F172A]">{preview.resourceCap.reviewCadence}</strong>
              </span>
            </div>

            <div className="space-y-2">
              {preview.okrs.map((obj, idx) => (
                <div key={obj.id} className="text-xs">
                  <div className="font-semibold text-[#0F172A]">
                    O{idx + 1}. {obj.title}
                  </div>
                  <ul className="mt-1 space-y-0.5 text-slate-600 pl-4 list-disc">
                    {obj.keyResults.map((kr) => (
                      <li key={kr.id}>
                        {kr.title}{' '}
                        <span className="font-mono tabular-nums text-slate-500">
                          (Target: {kr.targetValue} {kr.metricUnit})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-[#0F172A] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply(product.id, selectedStrategy, selectedLever)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Strategy &amp; Generate OKRs
          </button>
        </div>
      </div>
    </div>
  );
}
