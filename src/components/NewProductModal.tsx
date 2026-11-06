import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { BCG_META, classifyBcgQuadrant } from '../engine/strategyEngine';
import { clampNumber, sanitizeText } from '../security/sanitizer';

interface NewProductModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    owner: string;
    marketShare: number;
    marketGrowth: number;
  }) => void;
}

export function NewProductModal({ open, onClose, onCreate }: NewProductModalProps) {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [marketShare, setMarketShare] = useState(0.6);
  const [marketGrowth, setMarketGrowth] = useState(24);
  const [error, setError] = useState('');

  if (!open) return null;

  const previewQuad = classifyBcgQuadrant(marketShare, marketGrowth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 80);
    if (!cleanName) {
      setError('Please enter a valid product name.');
      return;
    }
    const cleanOwner = sanitizeText(owner, 60) || 'Product Lead';
    onCreate({
      name: cleanName,
      owner: cleanOwner,
      marketShare: clampNumber(marketShare, 0.1, 4.0, 0.6),
      marketGrowth: clampNumber(marketGrowth, 0, 40, 24),
    });
    setName('');
    setOwner('');
    setError('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 id="new-product-title" className="text-base font-bold text-[#0F172A]">
            Add Portfolio Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          <div>
            <label htmlFor="prod-name" className="block text-xs font-medium text-slate-700 mb-1">
              Product Name
            </label>
            <input
              id="prod-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Atlas Edge Sync"
              maxLength={80}
              required
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          <div>
            <label htmlFor="prod-owner" className="block text-xs font-medium text-slate-700 mb-1">
              Product Owner
            </label>
            <input
              id="prod-owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Jordan Lee"
              maxLength={60}
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prod-share"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Relative Share (0.1x–4.0x)
              </label>
              <input
                id="prod-share"
                type="number"
                min={0.1}
                max={4.0}
                step={0.05}
                value={marketShare}
                onChange={(e) => setMarketShare(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAFAFA] border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div>
              <label
                htmlFor="prod-growth"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Market Growth (0%–40%)
              </label>
              <input
                id="prod-growth"
                type="number"
                min={0}
                max={40}
                step={1}
                value={marketGrowth}
                onChange={(e) => setMarketGrowth(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FAFAFA] border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#FAFAFA] border border-slate-200 rounded-md text-xs text-slate-600 flex items-center justify-between">
            <span>Initial BCG Placement</span>
            <strong className="text-[#0F172A]">{BCG_META[previewQuad].label}</strong>
          </div>

          {error && <p className="text-xs text-[#DC2626]">{error}</p>}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-[#0F172A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Place &amp; Launch Ansoff Wizard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
