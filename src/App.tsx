import { useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Header } from '@/components/ui/Header';
import { StatusBar } from '@/components/ui/StatusBar';
import { HelpModal } from '@/components/ui/HelpModal';
import { FilterBar } from '@/components/filters/FilterBar';
import { DataGrid } from '@/components/grid/DataGrid';
import { SelectionBar } from '@/components/grid/SelectionBar';
import { ReviewDrawer } from '@/components/drawer/ReviewDrawer';
import { KeyboardProvider, useKeyboard } from '@/lib/keyboard/KeyboardProvider';

import { useRecords, useRecordMutation, useBatchMutation } from '@/features/records/hooks/useRecords';
import { useUIStore, initializeTheme } from '@/features/records/store/uiStore';
import { useFocusStore } from '@/features/records/store/focusStore';
import { useSelectionStore } from '@/features/records/store/selectionStore';

import { getMockRecords } from '@/lib/data/generateMockData';
import type { ContentRecord, ActionType } from '@/types/record';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Initialize theme before render
initializeTheme();

function MainContent() {
  const { setRecords } = useKeyboard();

  // Queries and mutations
  const { data: records = [], isLoading } = useRecords();
  const recordMutation = useRecordMutation();
  const batchMutation = useBatchMutation();

  // Store refs
  const { isFilterBarOpen, theme } = useUIStore();
  const { openDrawer, closeDrawer, drawerRecordId } = useFocusStore();
  const { clearSelection } = useSelectionStore();

  // Get total records count (unfiltered)
  const totalRecords = getMockRecords().length;

  // Update keyboard context with current records
  useEffect(() => {
    setRecords(records);
  }, [records, setRecords]);

  // Handle single record action
  const handleAction = useCallback(
    (action: ActionType, recordId: string, blockReason?: string) => {
      recordMutation.mutate({ recordId, action, blockReason });
    },
    [recordMutation]
  );

  // Handle batch action
  const handleBatchAction = useCallback(
    (action: ActionType, recordIds: string[], blockReason?: string) => {
      batchMutation.mutate({ recordIds, action, blockReason });
      clearSelection();
    },
    [batchMutation, clearSelection]
  );

  // Handle row click
  const handleRowClick = useCallback(
    (record: ContentRecord) => {
      openDrawer(record.id);
    },
    [openDrawer]
  );

  // Get drawer record
  const drawerRecord = drawerRecordId
    ? records.find((r) => r.id === drawerRecordId) ?? null
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="text-text-secondary">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Header */}
      <Header totalRecords={totalRecords} filteredCount={records.length} />

      {/* Filter bar (collapsible) */}
      {isFilterBarOpen && <FilterBar />}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <DataGrid
          records={records}
          onRowClick={handleRowClick}
        />
      </main>

      {/* Status bar */}
      <StatusBar totalRows={records.length} />

      {/* Selection bar (floating) */}
      <SelectionBar onBatchAction={handleBatchAction} />

      {/* Review drawer - key forces re-render when record status changes */}
      <ReviewDrawer
        key={drawerRecord ? `${drawerRecord.id}-${drawerRecord.status}` : 'closed'}
        record={drawerRecord}
        onClose={closeDrawer}
        onAction={handleAction}
      />

      {/* Help modal */}
      <HelpModal />

      {/* Toast notifications */}
      <Toaster
        position="bottom-left"
        theme={theme}
        toastOptions={{
          className: 'bg-surface-2 border-surface-3 text-text-primary',
        }}
      />
    </div>
  );
}

function AppWithKeyboard() {
  const recordMutation = useRecordMutation();
  const batchMutation = useBatchMutation();
  const { clearSelection } = useSelectionStore();

  const handleAction = useCallback(
    (action: ActionType, recordId: string, blockReason?: string) => {
      recordMutation.mutate({ recordId, action, blockReason });
    },
    [recordMutation]
  );

  const handleBatchAction = useCallback(
    (action: ActionType, recordIds: string[], blockReason?: string) => {
      batchMutation.mutate({ recordIds, action, blockReason });
      clearSelection();
    },
    [batchMutation, clearSelection]
  );

  return (
    <KeyboardProvider onAction={handleAction} onBatchAction={handleBatchAction}>
      <MainContent />
    </KeyboardProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithKeyboard />
    </QueryClientProvider>
  );
}
