import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="group relative inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        aria-label="More information"
        tabIndex={0}
      >
        <Info className="w-4 h-4" />
        
        {}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 pointer-events-none z-50">
          {content}
          {}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-900 dark:bg-zinc-800 rotate-45"></div>
        </div>
      </button>
    </div>
  );
}
