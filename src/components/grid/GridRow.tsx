import { memo } from 'react';
import type { ContentRecord, Status, Impact } from '@/types/record';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { usePendingOpsStore } from '@/features/records/store/pendingOpsStore';

interface GridRowProps {
  record: ContentRecord;
  index: number;
  isFocused: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onFocus: (index: number) => void;
  onClick: () => void;
}

// Status styling configuration
const STATUS_CONFIG: Record<
  Status,
  { border: string; dot: string; text: string; label: string }
> = {
  Queued: {
    border: 'border-l-status-queued/40',
    dot: 'bg-status-queued',
    text: 'text-text-secondary',
    label: 'Queued',
  },
  InReview: {
    border: 'border-l-status-in-review/60',
    dot: 'bg-status-in-review animate-pulse-subtle',
    text: 'text-status-in-review',
    label: 'In Review',
  },
  Approved: {
    border: 'border-l-status-approved/50',
    dot: 'bg-status-approved',
    text: 'text-status-approved',
    label: 'Approved',
  },
  Published: {
    border: 'border-l-status-published/50',
    dot: 'bg-status-published',
    text: 'text-status-published',
    label: 'Published',
  },
  Blocked: {
    border: 'border-l-status-blocked/50',
    dot: 'bg-status-blocked',
    text: 'text-status-blocked',
    label: 'Blocked',
  },
};

// Impact styling configuration
const IMPACT_CONFIG: Record<Impact, { weight: string; icon: string; color: string }> = {
  High: {
    weight: 'font-medium',
    icon: '\u25B2', // ▲
    color: 'text-impact-high',
  },
  Medium: {
    weight: 'font-normal',
    icon: '\u2500', // ─
    color: 'text-impact-medium',
  },
  Low: {
    weight: 'font-normal opacity-70',
    icon: '\u25BC', // ▼
    color: 'text-impact-low',
  },
};

// Engine short names
const ENGINE_SHORT: Record<string, string> = {
  ChatGPT: 'GPT',
  Gemini: 'GEM',
  Perplexity: 'PPLX',
};

export const GridRow = memo(function GridRow({
  record,
  index,
  isFocused,
  isSelected,
  onSelect,
  onFocus,
  onClick,
}: GridRowProps) {
  const hasPendingOps = usePendingOpsStore((s) => s.hasPendingOps(record.id));
  const statusConfig = STATUS_CONFIG[record.status];
  const impactConfig = IMPACT_CONFIG[record.impact];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(record.id);
  };

  const handleRowClick = () => {
    onFocus(index);
    onClick();
  };

  return (
    <div
      role="row"
      aria-rowindex={index + 1}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onClick={handleRowClick}
      className={cn(
        // Base row styles
        'grid grid-cols-[40px_1fr_80px_100px_50px_70px] items-center',
        'h-11 px-3 border-b border-surface-3/50',
        'transition-colors duration-75 cursor-pointer',
        'hover:bg-surface-3/30',

        // Status left border
        'border-l-2',
        statusConfig.border,

        // Focus state
        isFocused && 'bg-surface-3/50 border-l-accent',

        // Selected state
        isSelected && 'bg-accent/8',

        // Focus + Selected
        isFocused && isSelected && 'bg-accent/12',

        // Pending operation state
        hasPendingOps && 'opacity-70'
      )}
    >
      {/* Selection checkbox */}
      <div className="flex items-center justify-center" onClick={handleCheckboxClick}>
        <div
          className={cn(
            'w-4 h-4 rounded border border-surface-4',
            'flex items-center justify-center transition-colors',
            'hover:border-accent',
            isSelected && 'bg-accent border-accent'
          )}
        >
          {isSelected && (
            <svg
              className="w-3 h-3 text-surface-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Prompt (primary column) */}
      <div className="flex flex-col min-w-0 pr-4">
        <span
          className={cn(
            'text-sm truncate',
            record.status === 'Blocked' ? 'line-through opacity-60' : '',
            impactConfig.weight
          )}
        >
          {record.prompt}
        </span>
        {record.safetyFlags.length > 0 && (
          <span className="text-xs text-error/70 truncate mt-0.5">
            {record.safetyFlags.slice(0, 2).join(' \u00B7 ')}
            {record.safetyFlags.length > 2 && ` +${record.safetyFlags.length - 2}`}
          </span>
        )}
      </div>

      {/* Engine */}
      <span className="text-xs font-mono text-text-tertiary uppercase tracking-wide">
        {ENGINE_SHORT[record.engine] || record.engine.slice(0, 4)}
      </span>

      {/* Status - dot + label */}
      <div className="flex items-center gap-1.5">
        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', statusConfig.dot)} />
        <span className={cn('text-xs', statusConfig.text)}>{statusConfig.label}</span>
      </div>

      {/* Impact */}
      <span className={cn('text-xs font-mono text-center', impactConfig.color)}>
        {impactConfig.icon}
      </span>

      {/* Time */}
      <span className="text-xs font-mono text-text-tertiary text-right">
        {formatRelativeTime(record.updatedAt)}
      </span>

      {/* Pending indicator */}
      {hasPendingOps && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      )}
    </div>
  );
});
