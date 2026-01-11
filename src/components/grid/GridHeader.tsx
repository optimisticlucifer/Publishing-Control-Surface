import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/features/records/store/selectionStore';

interface GridHeaderProps {
  filteredCount: number;
  onSelectAll: () => void;
}

export function GridHeader({ filteredCount, onSelectAll }: GridHeaderProps) {
  const selectedCount = useSelectionStore((s) => s.getSelectedCount());
  const allSelected = selectedCount > 0 && selectedCount === filteredCount;
  const someSelected = selectedCount > 0 && selectedCount < filteredCount;

  const handleCheckboxClick = () => {
    onSelectAll();
  };

  return (
    <div
      role="row"
      className={cn(
        'grid grid-cols-[40px_1fr_80px_100px_50px_70px] items-center',
        'h-9 px-3 border-b border-surface-3',
        'bg-surface-1 sticky top-0 z-10',
        'text-xs font-medium text-text-secondary uppercase tracking-wide'
      )}
    >
      {/* Select all checkbox */}
      <div className="flex items-center justify-center" onClick={handleCheckboxClick}>
        <div
          className={cn(
            'w-4 h-4 rounded border border-surface-4',
            'flex items-center justify-center transition-colors cursor-pointer',
            'hover:border-accent',
            allSelected && 'bg-accent border-accent',
            someSelected && 'bg-accent/50 border-accent'
          )}
        >
          {allSelected && (
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
          {someSelected && !allSelected && (
            <svg
              className="w-3 h-3 text-surface-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          )}
        </div>
      </div>

      {/* Prompt column */}
      <div className="pr-4">Prompt</div>

      {/* Engine column */}
      <div>Engine</div>

      {/* Status column */}
      <div>Status</div>

      {/* Impact column */}
      <div className="text-center">Imp</div>

      {/* Time column */}
      <div className="text-right">Time</div>
    </div>
  );
}
