import { HelpCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export function Tooltip({ content, children, align = 'center' }: TooltipProps) {
  const [open, setOpen] = useState(false);

  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children ?? (
        <button
          type="button"
          aria-label={content}
          className="inline-flex items-center justify-center w-5 h-5 text-slate-400 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-sm transition-colors cursor-help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full mb-2 z-40 w-64 px-3 py-2 text-xs leading-relaxed text-white bg-[#0F172A] rounded-md shadow-sm ${alignClass}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
