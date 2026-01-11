import { cn } from '@/lib/utils';
import { useUIStore } from '@/features/records/store/uiStore';
import { useSelectionStore } from '@/features/records/store/selectionStore';
import { SearchInput } from '@/components/filters/SearchInput';
import logoImage from '@/assets/gravtonlabs_logo.jpeg';

interface HeaderProps {
  totalRecords: number;
  filteredCount: number;
}

export function Header({ totalRecords, filteredCount }: HeaderProps) {
  const { theme, toggleTheme, toggleFilterBar, toggleHelpModal, isFilterBarOpen } = useUIStore();
  const selectedCount = useSelectionStore((s) => s.getSelectedCount());

  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-surface-3/50 bg-surface-1/95 backdrop-blur-sm">
      {/* Left: Logo and title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={logoImage}
            alt="Gravton Labs"
            className={cn('h-7 w-7 rounded', theme === 'light' && 'invert')}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gradient">Publishing Control Surface</span>
          <span className="text-xs text-text-tertiary">
            {filteredCount.toLocaleString()} of {totalRecords.toLocaleString()} items
            {selectedCount > 0 && (
              <span className="text-accent"> · {selectedCount} selected</span>
            )}
          </span>
        </div>
      </div>

      {/* Right: Search and actions */}
      <div className="flex items-center gap-3">
        <SearchInput />

        {/* Filter toggle */}
        <button
          onClick={toggleFilterBar}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 text-xs',
            'rounded border transition-all duration-200',
            isFilterBarOpen
              ? 'bg-accent/10 border-accent/30 text-accent glow-accent-sm'
              : 'bg-surface-2/80 border-surface-3/50 text-text-secondary hover:text-text-primary hover:bg-surface-3/50'
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="kbd">f</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center justify-center w-8 h-8',
            'rounded border border-surface-3/50 bg-surface-2/80',
            'text-text-secondary hover:text-text-primary hover:bg-surface-3/50 transition-all duration-200'
          )}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Help */}
        <button
          onClick={toggleHelpModal}
          className={cn(
            'flex items-center justify-center w-8 h-8',
            'rounded border border-surface-3/50 bg-surface-2/80',
            'text-text-secondary hover:text-text-primary hover:bg-surface-3/50 transition-all duration-200'
          )}
          title="Keyboard shortcuts"
        >
          <span className="kbd">?</span>
        </button>
      </div>
    </header>
  );
}
