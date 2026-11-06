import { ArrowDown, ArrowUp, ArrowUpRight, Check, Pencil, SlidersHorizontal, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  ANSOFF_LABELS,
  BCG_META,
  BCG_THRESHOLDS,
  calculateProductOkrProgress,
  classifyBcgQuadrant,
  getQuadrantTrend,
} from '../engine/strategyEngine';
import { clampNumber } from '../security/sanitizer';
import { BcgQuadrant, ProductNode } from '../types/strategy';
import { Tooltip } from './Tooltip';

interface BcgMatrixViewProps {
  products: ProductNode[];
  selectedId: string;
  onSelectProduct: (id: string) => void;
  onMoveProduct: (id: string, marketShare: number, marketGrowth: number, triggerWizard: boolean) => void;
  onUpdateProduct: (
    id: string,
    updates: { name: string; owner: string; marketShare: number; marketGrowth: number }
  ) => void;
  onOpenAnsoffWizard: (product: ProductNode) => void;
  onDeleteProduct: (id: string) => void;
  onNavigateExecution: () => void;
}

const QUADRANT_ORDER: BcgQuadrant[] = ['question_mark', 'star', 'dog', 'cash_cow'];

export function BcgMatrixView({
  products,
  selectedId,
  onSelectProduct,
  onMoveProduct,
  onUpdateProduct,
  onOpenAnsoffWizard,
  onDeleteProduct,
  onNavigateExecution,
}: BcgMatrixViewProps) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartQuadrant, setDragStartQuadrant] = useState<BcgQuadrant | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editShare, setEditShare] = useState(1.0);
  const [editGrowth, setEditGrowth] = useState(15);

  const selectedProduct = products.find((p) => p.id === selectedId) ?? products[0] ?? null;

  useEffect(() => {
    setEditing(false);
  }, [selectedId]);

  const startEditing = (product: ProductNode) => {
    setEditName(product.name);
    setEditOwner(product.owner);
    setEditShare(product.marketShare);
    setEditGrowth(product.marketGrowth);
    setEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editName.trim()) return;
    onUpdateProduct(selectedProduct.id, {
      name: editName,
      owner: editOwner,
      marketShare: editShare,
      marketGrowth: editGrowth,
    });
    setEditing(false);
  };

  // Map marketShare (0.1..4.0) -> X% (0..100) and marketGrowth (0..40) -> Y% (100..0)
  const shareToX = (share: number) => ((clampNumber(share, 0.1, 4.0, 1.0) - 0.1) / 3.9) * 100;
  const growthToY = (growth: number) => 100 - (clampNumber(growth, 0, 40, 15) / 40) * 100;

  const thresholdX = shareToX(BCG_THRESHOLDS.share);
  const thresholdY = growthToY(BCG_THRESHOLDS.growth);

  const computeCoordsFromPointer = (clientX: number, clientY: number) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const relX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const relY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const share = clampNumber(0.1 + relX * 3.9, 0.1, 4.0, 1.0);
    const growth = clampNumber((1 - relY) * 40, 0, 40, 15);
    return { share, growth };
  };

  const handlePointerDown = (e: React.PointerEvent, product: ProductNode) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSelectProduct(product.id);
    setDraggingId(product.id);
    setDragStartQuadrant(product.bcgQuadrant);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const coords = computeCoordsFromPointer(e.clientX, e.clientY);
    if (!coords) return;
    onMoveProduct(draggingId, coords.share, coords.growth, false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const coords = computeCoordsFromPointer(e.clientX, e.clientY);
    const currentId = draggingId;
    const startQuad = dragStartQuadrant;
    setDraggingId(null);
    setDragStartQuadrant(null);
    if (coords) {
      const nextQuad = classifyBcgQuadrant(coords.share, coords.growth);
      const changed = startQuad !== null && nextQuad !== startQuad;
      onMoveProduct(currentId, coords.share, coords.growth, changed);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 8 Cols: Interactive 2x2 BCG Matrix */}
      <section className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#0F172A]">
              BCG Portfolio Matrix
            </h2>
            <Tooltip
              align="left"
              content="Drag any product node across quadrants to reclassify. Moving a product into a new quadrant automatically triggers the Ansoff Growth Wizard."
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono tabular-nums">
            <span>Share ≥ 1.0x</span>
            <span aria-hidden="true">·</span>
            <span>Growth ≥ 15%</span>
          </div>
        </div>

        {/* 2x2 Plot Area */}
        <div className="relative pl-8 pb-7">
          {/* Y-Axis Label */}
          <div className=" -rotate-90 origin-center absolute -left-7 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 whitespace-nowrap select-none">
            Market Growth (%)
          </div>

          <div
            ref={plotRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative h-[460px] w-full bg-[#FAFAFA] border border-slate-200 rounded-md overflow-hidden select-none touch-none"
          >
            {/* Threshold Hairlines */}
            <div
              style={{ left: `${thresholdX}%` }}
              className="absolute inset-y-0 w-px bg-slate-300 pointer-events-none"
            />
            <div
              style={{ top: `${thresholdY}%` }}
              className="absolute inset-x-0 h-px bg-slate-300 pointer-events-none"
            />

            {/* Quadrant Corner Labels + Tooltips */}
            {QUADRANT_ORDER.map((q) => {
              const posClass =
                q === 'question_mark'
                  ? 'top-3 left-3'
                  : q === 'star'
                    ? 'top-3 right-3 text-right'
                    : q === 'dog'
                      ? 'bottom-3 left-3'
                      : 'bottom-3 right-3 text-right';
              return (
                <div
                  key={q}
                  className={`absolute ${posClass} z-10 flex items-center gap-1.5`}
                >
                  <span className="text-xs font-semibold text-slate-500">
                    {BCG_META[q].label}
                  </span>
                  <Tooltip
                    align={q === 'star' || q === 'cash_cow' ? 'right' : 'left'}
                    content={BCG_META[q].tooltip}
                  />
                </div>
              );
            })}

            {/* Product Nodes */}
            {products.map((product) => {
              const x = shareToX(product.marketShare);
              const y = growthToY(product.marketGrowth);
              const isSelected = selectedProduct?.id === product.id;
              const isDragging = draggingId === product.id;
              const trend = getQuadrantTrend(product.bcgQuadrant, product.previousBcgQuadrant);
              const trendTitle =
                trend !== 'unchanged' && product.previousBcgQuadrant
                  ? `Moved from ${BCG_META[product.previousBcgQuadrant].label} to ${BCG_META[product.bcgQuadrant].label}`
                  : undefined;

              return (
                <button
                  key={product.id}
                  type="button"
                  title={trendTitle}
                  onPointerDown={(e) => handlePointerDown(e, product)}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`group absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-md border text-left transition-shadow cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md z-30'
                      : 'bg-white text-[#0F172A] border-slate-300 hover:border-[#1D4ED8] shadow-xs'
                  } ${isDragging ? 'scale-105' : ''}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      product.bcgQuadrant === 'star'
                        ? 'bg-[#1D4ED8]'
                        : product.bcgQuadrant === 'question_mark'
                          ? 'bg-[#D97706]'
                          : product.bcgQuadrant === 'cash_cow'
                            ? 'bg-[#16A34A]'
                            : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-semibold whitespace-nowrap max-w-[140px] truncate">
                    {product.name}
                  </span>
                  {trend === 'up' && (
                    <ArrowUp
                      aria-label={trendTitle}
                      className="w-3.5 h-3.5 text-[#16A34A] shrink-0"
                    />
                  )}
                  {trend === 'down' && (
                    <ArrowDown
                      aria-label={trendTitle}
                      className="w-3.5 h-3.5 text-[#DC2626] shrink-0"
                    />
                  )}
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {product.marketShare.toFixed(1)}x
                  </span>
                </button>
              );
            })}
          </div>

          {/* X-Axis Label */}
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
            <span>0.1x</span>
            <span className="font-sans font-medium">Relative Market Share (1.0x threshold)</span>
            <span>4.0x</span>
          </div>
        </div>
      </section>

      {/* Right 4 Cols: Selected Product Bridge Inspector */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6">
        {selectedProduct ? (
          <div>
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>
                    {BCG_META[selectedProduct.bcgQuadrant].label} · {selectedProduct.owner}
                  </span>
                  {selectedProduct.previousBcgQuadrant &&
                    selectedProduct.previousBcgQuadrant !== selectedProduct.bcgQuadrant && (
                      <span
                        className={`inline-flex items-center gap-0.5 font-medium ${
                          getQuadrantTrend(
                            selectedProduct.bcgQuadrant,
                            selectedProduct.previousBcgQuadrant
                          ) === 'up'
                            ? 'text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        ·
                        {getQuadrantTrend(
                          selectedProduct.bcgQuadrant,
                          selectedProduct.previousBcgQuadrant
                        ) === 'up' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        from {BCG_META[selectedProduct.previousBcgQuadrant].label}
                      </span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                  {selectedProduct.name}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => (editing ? setEditing(false) : startEditing(selectedProduct))}
                  aria-label={`Edit ${selectedProduct.name}`}
                  className="p-2 text-slate-400 hover:text-[#1D4ED8] rounded-md transition-colors cursor-pointer"
                >
                  {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(selectedProduct.id)}
                    aria-label={`Remove ${selectedProduct.name}`}
                    className="p-2 text-slate-400 hover:text-[#DC2626] rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {editing && (
              <form
                onSubmit={handleSaveEdit}
                className="py-4 space-y-3 border-b border-slate-200 bg-[#FAFAFA] -mx-6 px-6"
              >
                <div>
                  <label htmlFor="edit-prod-name" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Product Name
                  </label>
                  <input
                    id="edit-prod-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={80}
                    required
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label htmlFor="edit-prod-owner" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Product Owner
                  </label>
                  <input
                    id="edit-prod-owner"
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    maxLength={60}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="edit-prod-share" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Share (0.1x–4.0x)
                    </label>
                    <input
                      id="edit-prod-share"
                      type="number"
                      min={0.1}
                      max={4.0}
                      step={0.05}
                      value={editShare}
                      onChange={(e) => setEditShare(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-prod-growth" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Growth (0%–40%)
                    </label>
                    <input
                      id="edit-prod-growth"
                      type="number"
                      min={0}
                      max={40}
                      step={1}
                      value={editGrowth}
                      onChange={(e) => setEditGrowth(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-[#0F172A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Coordinate Sliders */}
            <div className="py-4 space-y-3 border-b border-slate-200">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Relative Market Share</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    {selectedProduct.marketShare.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={4.0}
                  step={0.05}
                  value={selectedProduct.marketShare}
                  onChange={(e) => {
                    const nextShare = Number(e.target.value);
                    const nextQuad = classifyBcgQuadrant(nextShare, selectedProduct.marketGrowth);
                    onMoveProduct(
                      selectedProduct.id,
                      nextShare,
                      selectedProduct.marketGrowth,
                      nextQuad !== selectedProduct.bcgQuadrant
                    );
                  }}
                  className="w-full accent-[#1D4ED8] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Market Growth Rate</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    {selectedProduct.marketGrowth.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={selectedProduct.marketGrowth}
                  onChange={(e) => {
                    const nextGrowth = Number(e.target.value);
                    const nextQuad = classifyBcgQuadrant(selectedProduct.marketShare, nextGrowth);
                    onMoveProduct(
                      selectedProduct.id,
                      selectedProduct.marketShare,
                      nextGrowth,
                      nextQuad !== selectedProduct.bcgQuadrant
                    );
                  }}
                  className="w-full accent-[#1D4ED8] cursor-pointer"
                />
              </div>
            </div>

            {/* Linked Ansoff & Resource Cap Summary */}
            <div className="py-4 space-y-2.5 text-sm border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ansoff Vector</span>
                <span className="font-semibold text-[#0F172A]">
                  {ANSOFF_LABELS[selectedProduct.ansoffStrategy]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Strategic Lever</span>
                <span className="text-slate-800">{selectedProduct.strategicLever}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Budget Cap</span>
                <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                  {selectedProduct.resourceCap.allocatedBudgetPct}% / {selectedProduct.resourceCap.maxBudgetPct}% max
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Headcount Cap</span>
                <span className="font-mono tabular-nums text-[#0F172A]">
                  {selectedProduct.resourceCap.maxFte} FTE · {selectedProduct.resourceCap.reviewCadence}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">OKR Progress</span>
                <span className="font-mono tabular-nums font-semibold text-[#1D4ED8]">
                  {calculateProductOkrProgress(selectedProduct)}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onOpenAnsoffWizard(selectedProduct)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Configure Ansoff &amp; Regenerate OKRs
              </button>
              <button
                type="button"
                onClick={onNavigateExecution}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 hover:text-[#0F172A] border border-slate-200 hover:border-slate-300 rounded-md transition-colors cursor-pointer"
              >
                View {selectedProduct.okrs.length} Linked Objectives
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Select or add a product to inspect its strategy pipeline.
          </div>
        )}
      </aside>
    </div>
  );
}
