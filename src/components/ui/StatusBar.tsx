import { cn } from '@/lib/utils';
import { useFocusStore } from '@/features/records/store/focusStore';
import { useSelectionStore } from '@/features/records/store/selectionStore';

interface StatusBarProps {
  totalRows: number;
}

export function StatusBar({ totalRows }: StatusBarProps) {
  const { focusedIndex } = useFocusStore();
  const selectedCount = useSelectionStore((s) => s.getSelectedCount());

  return (
    <div
      className={cn(
        'h-8 px-4 flex items-center justify-between',
        'border-t border-surface-3/50 bg-surface-1/95 backdrop-blur-sm',
        'text-xs text-text-tertiary'
      )}
    >
      {/* Left: Row position */}
      <div className="flex items-center gap-4">
        <span>
          Row {focusedIndex + 1} of {totalRows.toLocaleString()}
        </span>
        {selectedCount > 0 && (
          <span className="text-accent">{selectedCount} selected</span>
        )}
      </div>

      {/* Right: Quick hints */}
      <div className="flex items-center gap-4">
        <span>
          <span className="kbd">a</span> Approve
        </span>
        <span>
          <span className="kbd">b</span> Block
        </span>
        <span>
          <span className="kbd">p</span> Publish
        </span>
        <span>
          <span className="kbd">?</span> Help
        </span>
      </div>
    </div>
  );
}
