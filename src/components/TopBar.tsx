import { Plus } from 'lucide-react';
import { WorkspaceView } from '../types/strategy';

interface TopBarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onNewProduct: () => void;
}

const NAV_ITEMS: { id: WorkspaceView; label: string }[] = [
  { id: 'portfolio', label: 'Portfolio Matrix' },
  { id: 'execution', label: 'Execution & OKRs' },
  { id: 'caps', label: 'Resource Caps' },
];

export function TopBar({ activeView, onSelectView, onNewProduct }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#portfolio"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('portfolio');
          }}
          className="text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
        >
          Cadence Bridge
        </a>

        <nav aria-label="Primary Workspace" className="flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#0F172A]'
                    : 'text-slate-500 hover:text-[#0F172A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[17px] h-[2px] bg-[#1D4ED8]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onNewProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Product
          </button>
        </div>
      </div>
    </header>
  );
}
