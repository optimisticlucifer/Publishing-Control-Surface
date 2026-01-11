import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/features/records/store/uiStore';

const SHORTCUTS = [
  {
    category: 'Navigation',
    items: [
      { key: 'j / \u2193', description: 'Move focus down' },
      { key: 'k / \u2191', description: 'Move focus up' },
      { key: 'g', description: 'Jump to first row' },
      { key: 'G', description: 'Jump to last row' },
      { key: 'Page Up/Down', description: 'Page navigation' },
    ],
  },
  {
    category: 'Selection',
    items: [
      { key: 'x / Space', description: 'Toggle selection' },
      { key: 'Shift + j/k', description: 'Extend selection' },
      { key: 'Esc', description: 'Clear selection' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { key: 'Enter / o', description: 'Open review drawer' },
      { key: 'r', description: 'Start review (Queued \u2192 InReview)' },
      { key: 'a', description: 'Approve (InReview \u2192 Approved)' },
      { key: 'p', description: 'Publish (Approved \u2192 Published)' },
      { key: 'b', description: 'Block (Any \u2192 Blocked)' },
    ],
  },
  {
    category: 'Batch Actions',
    items: [
      { key: 'Shift + A', description: 'Approve selected' },
      { key: 'Shift + P', description: 'Publish selected' },
      { key: 'Shift + B', description: 'Block selected' },
    ],
  },
  {
    category: 'UI',
    items: [
      { key: '/', description: 'Focus search' },
      { key: 'f', description: 'Toggle filters' },
      { key: 't', description: 'Toggle theme' },
      { key: 'q', description: 'Close drawer' },
      { key: '?', description: 'Show this help' },
    ],
  },
];

export function HelpModal() {
  const { isHelpModalOpen, setHelpModalOpen } = useUIStore();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHelpModalOpen) {
        setHelpModalOpen(false);
      }
    };

    if (isHelpModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHelpModalOpen, setHelpModalOpen]);

  if (!isHelpModalOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setHelpModalOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[600px] max-w-[90vw] max-h-[80vh]',
          'bg-surface-1 border border-surface-3 rounded-lg shadow-xl',
          'z-50 overflow-y-auto',
          'animate-slide-up'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-1 border-b border-surface-3 px-6 py-4 flex items-center justify-between">
          <h2 id="help-title" className="text-lg font-medium text-text-primary">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setHelpModalOpen(false)}
            className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <span className="kbd">ESC</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-2 gap-6">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-text-secondary">{item.description}</span>
                    <span className="kbd whitespace-nowrap">{item.key}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-3 px-6 py-4">
          <p className="text-xs text-text-tertiary text-center">
            Power users can navigate entirely with the keyboard. Mouse is optional.
          </p>
        </div>
      </div>
    </>
  );
}
