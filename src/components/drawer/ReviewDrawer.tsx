import { useState, useEffect } from 'react';
import type { ContentRecord, Status, Impact, ActionType } from '@/types/record';
import { isValidAction } from '@/types/record';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { useFocusStore } from '@/features/records/store/focusStore';
import { useRecords } from '@/features/records/hooks/useRecords';

interface ReviewDrawerProps {
  record: ContentRecord | null;
  onClose: () => void;
  onAction: (action: ActionType, recordId: string, blockReason?: string) => void;
}

// Status display configuration
const STATUS_CONFIG: Record<Status, { dot: string; text: string; label: string }> = {
  Queued: {
    dot: 'bg-status-queued',
    text: 'text-status-queued',
    label: 'Queued',
  },
  InReview: {
    dot: 'bg-status-in-review',
    text: 'text-status-in-review',
    label: 'In Review',
  },
  Approved: {
    dot: 'bg-status-approved',
    text: 'text-status-approved',
    label: 'Approved',
  },
  Published: {
    dot: 'bg-status-published',
    text: 'text-status-published',
    label: 'Published',
  },
  Blocked: {
    dot: 'bg-status-blocked',
    text: 'text-status-blocked',
    label: 'Blocked',
  },
};

// Impact display configuration
const IMPACT_CONFIG: Record<Impact, { icon: string; color: string }> = {
  High: { icon: '\u25B2', color: 'text-impact-high' },
  Medium: { icon: '\u2500', color: 'text-impact-medium' },
  Low: { icon: '\u25BC', color: 'text-impact-low' },
};

export function ReviewDrawer({ record: recordProp, onClose, onAction }: ReviewDrawerProps) {
  const { isDrawerOpen, drawerRecordId } = useFocusStore();
  const { data: records = [] } = useRecords();
  const [blockReason, setBlockReason] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);

  // Get fresh record from query cache (updates with optimistic updates)
  const record = drawerRecordId
    ? records.find((r) => r.id === drawerRecordId) ?? recordProp
    : recordProp;

  // Reset block input when record changes or when status changes to Blocked
  useEffect(() => {
    setBlockReason('');
    setShowBlockInput(false);
  }, [record?.id, record?.status]);

  if (!record || !isDrawerOpen) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[record.status];
  const impactConfig = IMPACT_CONFIG[record.impact];

  const handleAction = (action: ActionType) => {
    if (action === 'block') {
      setShowBlockInput(true);
      return;
    }
    onAction(action, record.id);
  };

  const handleBlockSubmit = () => {
    if (blockReason.trim()) {
      onAction('block', record.id, blockReason.trim());
      setBlockReason('');
      setShowBlockInput(false);
    }
  };

  const handleBlockCancel = () => {
    setBlockReason('');
    setShowBlockInput(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[480px] max-w-full',
          'bg-surface-1 border-l border-surface-3 shadow-lg',
          'z-50 overflow-y-auto',
          'animate-slide-in-right'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-1 border-b border-surface-3 px-6 py-4 flex items-center justify-between">
          <h2 id="drawer-title" className="text-lg font-medium text-text-primary">
            Review Item
          </h2>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <span className="kbd">ESC</span>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt */}
          <div>
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">
              Prompt
            </h3>
            <div className="p-4 bg-surface-2 rounded border border-surface-3">
              <p className="text-sm text-text-primary leading-relaxed">{record.prompt}</p>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
              Metadata
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Engine</span>
                <span className="text-sm font-mono text-text-primary">{record.engine}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Status</span>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', statusConfig.dot)} />
                  <span className={cn('text-sm', statusConfig.text)}>{statusConfig.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Impact</span>
                <span className={cn('text-sm font-mono', impactConfig.color)}>
                  {impactConfig.icon} {record.impact}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Updated</span>
                <span className="text-sm font-mono text-text-tertiary">
                  {formatRelativeTime(record.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">ID</span>
                <span className="text-xs font-mono text-text-tertiary">{record.id}</span>
              </div>
            </div>
          </div>

          {/* Safety Flags */}
          {record.safetyFlags.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
                Safety Flags
              </h3>
              <ul className="space-y-2">
                {record.safetyFlags.map((flag, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-error/80"
                  >
                    <span className="text-error">\u2022</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Block Reason (if blocked) */}
          {record.status === 'Blocked' && record.blockReason && (
            <div>
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">
                Block Reason
              </h3>
              <p className="text-sm text-status-blocked">{record.blockReason}</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-surface-3" />

          {/* Actions */}
          <div>
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
              Actions
            </h3>

            {showBlockInput ? (
              <div className="space-y-3">
                <label className="block text-sm text-text-secondary">
                  Block reason (required):
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter the reason for blocking..."
                  className={cn(
                    'w-full h-24 px-3 py-2 text-sm',
                    'bg-surface-2 border border-surface-3 rounded',
                    'text-text-primary placeholder:text-text-tertiary',
                    'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30',
                    'resize-none'
                  )}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleBlockSubmit}
                    disabled={!blockReason.trim()}
                    className={cn(
                      'flex-1 h-9 px-4 text-sm font-medium rounded',
                      'bg-status-blocked text-surface-0',
                      'hover:bg-status-blocked/90 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Block
                  </button>
                  <button
                    onClick={handleBlockCancel}
                    className={cn(
                      'h-9 px-4 text-sm',
                      'bg-surface-3 text-text-secondary',
                      'hover:bg-surface-4 transition-colors rounded'
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {isValidAction(record.status, 'review') && (
                  <button
                    onClick={() => handleAction('review')}
                    className={cn(
                      'flex items-center gap-2 h-9 px-4 text-sm font-medium rounded',
                      'bg-surface-3 text-text-primary',
                      'hover:bg-surface-4 transition-colors'
                    )}
                  >
                    <span className="kbd">r</span>
                    Review
                  </button>
                )}
                {isValidAction(record.status, 'approve') && (
                  <button
                    onClick={() => handleAction('approve')}
                    className={cn(
                      'flex items-center gap-2 h-9 px-4 text-sm font-medium rounded',
                      'bg-status-approved text-surface-0',
                      'hover:bg-status-approved/90 transition-colors'
                    )}
                  >
                    <span className="kbd text-surface-0/70">a</span>
                    Approve
                  </button>
                )}
                {isValidAction(record.status, 'publish') && (
                  <button
                    onClick={() => handleAction('publish')}
                    className={cn(
                      'flex items-center gap-2 h-9 px-4 text-sm font-medium rounded',
                      'bg-status-published text-surface-0',
                      'hover:bg-status-published/90 transition-colors'
                    )}
                  >
                    <span className="kbd text-surface-0/70">p</span>
                    Publish
                  </button>
                )}
                {isValidAction(record.status, 'block') && (
                  <button
                    onClick={() => handleAction('block')}
                    className={cn(
                      'flex items-center gap-2 h-9 px-4 text-sm font-medium rounded',
                      'bg-surface-3 text-status-blocked',
                      'hover:bg-status-blocked hover:text-surface-0 transition-colors'
                    )}
                  >
                    <span className="kbd">b</span>
                    Block
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-1 border-t border-surface-3 px-6 py-3">
          <div className="flex items-center justify-center gap-6 text-xs text-text-tertiary">
            <span>
              <span className="kbd">j</span> Next
            </span>
            <span>
              <span className="kbd">k</span> Previous
            </span>
            <span>
              <span className="kbd">q</span> Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
