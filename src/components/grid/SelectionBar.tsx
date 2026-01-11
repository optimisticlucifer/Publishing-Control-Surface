import { useState } from 'react';
import type { ActionType } from '@/types/record';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/features/records/store/selectionStore';

interface SelectionBarProps {
  onBatchAction: (action: ActionType, recordIds: string[], blockReason?: string) => void;
}

export function SelectionBar({ onBatchAction }: SelectionBarProps) {
  const { getSelectedCount, getSelectedIds, clearSelection } = useSelectionStore();
  const selectedCount = getSelectedCount();
  const [showBlockInput, setShowBlockInput] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  if (selectedCount === 0) {
    return null;
  }

  const handleAction = (action: ActionType) => {
    if (action === 'block') {
      setShowBlockInput(true);
      return;
    }
    const ids = getSelectedIds();
    onBatchAction(action, ids);
  };

  const handleBlockSubmit = () => {
    if (blockReason.trim()) {
      const ids = getSelectedIds();
      onBatchAction('block', ids, blockReason.trim());
      setBlockReason('');
      setShowBlockInput(false);
    }
  };

  const handleBlockCancel = () => {
    setBlockReason('');
    setShowBlockInput(false);
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2',
        'flex items-center gap-4 px-5 py-3',
        'bg-surface-2/90 backdrop-blur-md border border-surface-3/50 rounded-lg shadow-2xl',
        'z-30 animate-slide-up glow-accent-sm',
        'relative corner-accent'
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <span className="text-xs font-medium text-surface-0">{selectedCount}</span>
        </div>
        <span className="text-sm text-text-secondary">
          {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-surface-3" />

      {showBlockInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Block reason..."
            className={cn(
              'w-48 h-8 px-3 text-sm',
              'bg-surface-1 border border-surface-3 rounded',
              'text-text-primary placeholder:text-text-tertiary',
              'focus:outline-none focus:border-accent/50'
            )}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlockSubmit();
              if (e.key === 'Escape') handleBlockCancel();
            }}
          />
          <button
            onClick={handleBlockSubmit}
            disabled={!blockReason.trim()}
            className={cn(
              'h-8 px-3 text-sm font-medium rounded',
              'bg-status-blocked text-surface-0',
              'hover:bg-status-blocked/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Block
          </button>
          <button
            onClick={handleBlockCancel}
            className="h-8 px-2 text-text-tertiary hover:text-text-secondary"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('approve')}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded',
                'bg-status-approved/20 text-status-approved',
                'hover:bg-status-approved hover:text-surface-0 hover:glow-status-approved transition-all duration-200'
              )}
            >
              <span className="kbd text-[9px]">Shift+A</span>
              Approve
            </button>
            <button
              onClick={() => handleAction('publish')}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded',
                'bg-status-published/20 text-status-published',
                'hover:bg-status-published hover:text-surface-0 hover:glow-status-published transition-all duration-200'
              )}
            >
              <span className="kbd text-[9px]">Shift+P</span>
              Publish
            </button>
            <button
              onClick={() => handleAction('block')}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded',
                'bg-status-blocked/20 text-status-blocked',
                'hover:bg-status-blocked hover:text-surface-0 hover:glow-status-blocked transition-all duration-200'
              )}
            >
              <span className="kbd text-[9px]">Shift+B</span>
              Block
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-surface-3" />

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 h-8 px-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <span className="kbd text-[9px]">Esc</span>
            Clear
          </button>
        </>
      )}
    </div>
  );
}
