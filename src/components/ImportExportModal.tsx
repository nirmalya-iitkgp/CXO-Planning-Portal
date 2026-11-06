import { Check, Download, RotateCcw, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { validateAndParsePortfolioJson } from '../security/sanitizer';
import { exportPortfolioJson } from '../storage/portfolioStorage';
import { ProductNode } from '../types/strategy';

interface ImportExportModalProps {
  open: boolean;
  products: ProductNode[];
  onClose: () => void;
  onImport: (products: ProductNode[]) => void;
  onReset: () => void;
}

export function ImportExportModal({
  open,
  products,
  onClose,
  onImport,
  onReset,
}: ImportExportModalProps) {
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(
    null
  );

  if (!open) return null;

  const handleDownload = () => {
    const json = exportPortfolioJson(products);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-bridge-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'Portfolio JSON downloaded.' });
  };

  const handleImportSubmit = () => {
    const res = validateAndParsePortfolioJson(importText);
    if (!res.ok) {
      setStatus({ type: 'error', msg: res.error });
      return;
    }
    onImport(res.data);
    setImportText('');
    setStatus({ type: 'success', msg: `Imported ${res.data.length} validated products.` });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="io-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 id="io-modal-title" className="text-base font-bold text-[#0F172A]">
            Portfolio JSON Export &amp; Import
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Portfolio JSON
          </button>

          <button
            type="button"
            onClick={() => {
              onReset();
              setStatus({ type: 'success', msg: 'Reset to default sample portfolio.' });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#DC2626] border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sample Data
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200">
          <label
            htmlFor="json-import-input"
            className="block text-xs font-semibold text-[#0F172A] mb-1.5"
          >
            Import Validated JSON
          </label>
          <textarea
            id="json-import-input"
            rows={5}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste exported JSON ({"products": [...]})...'
            className="w-full p-3 text-xs font-mono bg-[#FAFAFA] border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
          />
          <div className="mt-2 flex items-center justify-between">
            {status ? (
              <span
                className={`text-xs flex items-center gap-1 ${
                  status.type === 'error' ? 'text-[#DC2626]' : 'text-[#16A34A]'
                }`}
              >
                {status.type === 'success' && <Check className="w-3.5 h-3.5" />}
                {status.msg}
              </span>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={handleImportSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0F172A] bg-[#FAFAFA] hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Validate &amp; Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
