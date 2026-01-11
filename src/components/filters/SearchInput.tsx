import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/features/records/store/uiStore';
import { debounce } from '@/lib/utils';

interface SearchInputProps {
  onFocusChange?: (focused: boolean) => void;
}

export function SearchInput({ onFocusChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery } = useUIStore();
  const [localValue, setLocalValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search update
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    [setSearchQuery]
  );

  // Update local value when store changes
  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    debouncedSetSearch(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (localValue) {
        setLocalValue('');
        setSearchQuery('');
      } else {
        inputRef.current?.blur();
      }
    } else if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setLocalValue('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Expose focus method for keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // '/' to focus search (when not already focused on an input)
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search prompts..."
        className={cn(
          'w-64 h-8 pl-9 pr-8 text-sm',
          'bg-surface-2 border border-surface-3 rounded',
          'text-text-primary placeholder:text-text-tertiary',
          'transition-colors duration-150',
          'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30',
          isFocused && 'border-accent/50'
        )}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
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
      )}
      {!isFocused && !localValue && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <span className="kbd">/</span>
        </div>
      )}
    </div>
  );
}
