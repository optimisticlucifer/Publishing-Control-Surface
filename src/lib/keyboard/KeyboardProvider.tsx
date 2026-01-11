import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useFocusStore } from '@/features/records/store/focusStore';
import { useSelectionStore } from '@/features/records/store/selectionStore';
import { useUIStore } from '@/features/records/store/uiStore';
import type { ContentRecord, ActionType } from '@/types/record';
import { isValidAction } from '@/types/record';

interface KeyboardContextValue {
  // Record actions
  onAction: (action: ActionType, recordId: string, blockReason?: string) => void;
  onBatchAction: (action: ActionType, recordIds: string[], blockReason?: string) => void;

  // Get current records (for keyboard navigation)
  getRecords: () => ContentRecord[];
  setRecords: (records: ContentRecord[]) => void;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

interface KeyboardProviderProps {
  children: ReactNode;
  onAction: (action: ActionType, recordId: string, blockReason?: string) => void;
  onBatchAction: (action: ActionType, recordIds: string[], blockReason?: string) => void;
}

export function KeyboardProvider({
  children,
  onAction,
  onBatchAction,
}: KeyboardProviderProps) {
  const recordsRef = useRef<ContentRecord[]>([]);

  // Focus store
  const {
    focusedIndex,
    setFocusedIndex,
    moveFocus,
    jumpToFirst,
    jumpToLast,
    pageUp,
    pageDown,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    drawerRecordId,
  } = useFocusStore();

  // Selection store
  const { toggle, selectRange, clearSelection, getSelectedIds } = useSelectionStore();

  // UI store
  const { toggleFilterBar, toggleHelpModal, setHelpModalOpen, toggleTheme } = useUIStore();

  // Get/set records
  const getRecords = useCallback(() => recordsRef.current, []);
  const setRecords = useCallback((records: ContentRecord[]) => {
    recordsRef.current = records;
  }, []);

  // Get focused record
  const getFocusedRecord = useCallback((): ContentRecord | null => {
    const records = recordsRef.current;
    if (focusedIndex >= 0 && focusedIndex < records.length) {
      return records[focusedIndex];
    }
    return null;
  }, [focusedIndex]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Always allow Escape
      if (e.key === 'Escape') {
        if (isDrawerOpen) {
          closeDrawer();
          e.preventDefault();
          return;
        }
        if (getSelectedIds().length > 0) {
          clearSelection();
          e.preventDefault();
          return;
        }
        setHelpModalOpen(false);
        return;
      }

      // Don't capture if user is typing in an input (except for special keys)
      if (isInputFocused) {
        return;
      }

      const records = recordsRef.current;
      const totalRows = records.length;
      const focusedRecord = getFocusedRecord();

      switch (e.key) {
        // Navigation
        case 'j':
        case 'ArrowDown':
          if (e.shiftKey && focusedRecord) {
            // Extend selection
            const nextIndex = Math.min(focusedIndex + 1, totalRows - 1);
            const nextRecord = records[nextIndex];
            if (nextRecord) {
              selectRange(nextRecord.id, records.map((r) => r.id));
              setFocusedIndex(nextIndex);
            }
          } else {
            moveFocus('down', totalRows);
          }
          e.preventDefault();
          break;

        case 'k':
        case 'ArrowUp':
          if (e.shiftKey && focusedRecord) {
            // Extend selection
            const prevIndex = Math.max(focusedIndex - 1, 0);
            const prevRecord = records[prevIndex];
            if (prevRecord) {
              selectRange(prevRecord.id, records.map((r) => r.id));
              setFocusedIndex(prevIndex);
            }
          } else {
            moveFocus('up', totalRows);
          }
          e.preventDefault();
          break;

        case 'g':
          // Double 'g' to go to top (vim-style) - simplified: just go to top on 'g'
          jumpToFirst();
          e.preventDefault();
          break;

        case 'G':
          jumpToLast(totalRows);
          e.preventDefault();
          break;

        case 'Home':
          jumpToFirst();
          e.preventDefault();
          break;

        case 'End':
          jumpToLast(totalRows);
          e.preventDefault();
          break;

        case 'PageUp':
          pageUp(totalRows);
          e.preventDefault();
          break;

        case 'PageDown':
          pageDown(totalRows);
          e.preventDefault();
          break;

        // Selection
        case 'x':
        case ' ':
          if (focusedRecord) {
            toggle(focusedRecord.id);
            e.preventDefault();
          }
          break;

        // Open drawer
        case 'Enter':
        case 'o':
          if (focusedRecord) {
            if (isDrawerOpen && drawerRecordId === focusedRecord.id) {
              closeDrawer();
            } else {
              openDrawer(focusedRecord.id);
            }
            e.preventDefault();
          }
          break;

        // Close drawer
        case 'q':
          if (isDrawerOpen) {
            closeDrawer();
            e.preventDefault();
          }
          break;

        // Actions - Single record
        case 'a':
          if (focusedRecord && isValidAction(focusedRecord.status, 'approve')) {
            onAction('approve', focusedRecord.id);
            e.preventDefault();
          }
          break;

        case 'r':
          if (focusedRecord && isValidAction(focusedRecord.status, 'review')) {
            onAction('review', focusedRecord.id);
            e.preventDefault();
          }
          break;

        case 'p':
          if (focusedRecord && isValidAction(focusedRecord.status, 'publish')) {
            onAction('publish', focusedRecord.id);
            e.preventDefault();
          }
          break;

        case 'b':
          // Block requires a reason
          if (focusedRecord && isValidAction(focusedRecord.status, 'block')) {
            const reason = window.prompt('Enter block reason:');
            if (reason) {
              onAction('block', focusedRecord.id, reason);
            }
            e.preventDefault();
          }
          break;

        // Batch actions (Shift + key = uppercase)
        case 'A': {
          // Allow Ctrl/Cmd+A for native select all
          if (e.ctrlKey || e.metaKey) {
            break;
          }
          const selectedIds = getSelectedIds();
          if (selectedIds.length > 0) {
            onBatchAction('approve', selectedIds);
            e.preventDefault();
          }
          break;
        }

        case 'P': {
          const selectedIds = getSelectedIds();
          if (selectedIds.length > 0) {
            onBatchAction('publish', selectedIds);
            e.preventDefault();
          }
          break;
        }

        case 'B': {
          const selectedIds = getSelectedIds();
          if (selectedIds.length > 0) {
            const reason = window.prompt('Enter block reason:');
            if (reason) {
              onBatchAction('block', selectedIds, reason);
            }
            e.preventDefault();
          }
          break;
        }

        // UI toggles
        case 'f':
          toggleFilterBar();
          e.preventDefault();
          break;

        case '?':
          toggleHelpModal();
          e.preventDefault();
          break;

        case 't':
          toggleTheme();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedIndex,
    isDrawerOpen,
    drawerRecordId,
    moveFocus,
    jumpToFirst,
    jumpToLast,
    pageUp,
    pageDown,
    toggle,
    selectRange,
    clearSelection,
    getSelectedIds,
    openDrawer,
    closeDrawer,
    toggleFilterBar,
    toggleHelpModal,
    setHelpModalOpen,
    toggleTheme,
    onAction,
    onBatchAction,
    getFocusedRecord,
    setFocusedIndex,
  ]);

  const contextValue: KeyboardContextValue = {
    onAction,
    onBatchAction,
    getRecords,
    setRecords,
  };

  return (
    <KeyboardContext.Provider value={contextValue}>{children}</KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
