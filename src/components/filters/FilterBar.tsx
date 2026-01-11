import { useState, useRef, useEffect } from 'react';
import type { Status, Engine, Impact } from '@/types/record';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/features/records/store/uiStore';

const STATUSES: Status[] = ['Queued', 'InReview', 'Approved', 'Published', 'Blocked'];
const ENGINES: Engine[] = ['ChatGPT', 'Gemini', 'Perplexity'];
const IMPACTS: Impact[] = ['High', 'Medium', 'Low'];

interface FilterDropdownProps<T extends string> {
  label: string;
  options: T[];
  selected: T[];
  onChange: (values: T[]) => void;
  getDisplayLabel?: (value: T) => string;
}

function FilterDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
  getDisplayLabel,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const displayValue = selected.length === 0 ? 'All' : `${selected.length} selected`;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 h-7 px-3 text-xs',
          'bg-surface-2 border border-surface-3 rounded',
          'text-text-secondary hover:text-text-primary',
          'transition-colors duration-150',
          selected.length > 0 && 'border-accent/50 text-accent'
        )}
      >
        <span className="text-text-tertiary">{label}:</span>
        <span>{displayValue}</span>
        <svg
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-surface-2 border border-surface-3 rounded shadow-lg z-20">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-xs text-left',
                'hover:bg-surface-3 transition-colors',
                selected.includes(option) && 'text-accent'
              )}
            >
              <div
                className={cn(
                  'w-3 h-3 rounded border border-surface-4',
                  'flex items-center justify-center',
                  selected.includes(option) && 'bg-accent border-accent'
                )}
              >
                {selected.includes(option) && (
                  <svg
                    className="w-2 h-2 text-surface-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span>{getDisplayLabel ? getDisplayLabel(option) : option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar() {
  const {
    statusFilter,
    engineFilter,
    impactFilter,
    setStatusFilter,
    setEngineFilter,
    setImpactFilter,
    clearFilters,
    hasActiveFilters,
  } = useUIStore();

  const statusDisplayLabel = (status: Status): string => {
    if (status === 'InReview') return 'In Review';
    return status;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-3 bg-surface-1">
      <FilterDropdown
        label="Status"
        options={STATUSES}
        selected={statusFilter}
        onChange={setStatusFilter}
        getDisplayLabel={statusDisplayLabel}
      />

      <FilterDropdown
        label="Engine"
        options={ENGINES}
        selected={engineFilter}
        onChange={setEngineFilter}
      />

      <FilterDropdown
        label="Impact"
        options={IMPACTS}
        selected={impactFilter}
        onChange={setImpactFilter}
      />

      {hasActiveFilters() && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 h-7 px-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear all
        </button>
      )}
    </div>
  );
}
