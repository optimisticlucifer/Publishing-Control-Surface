import { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ContentRecord } from '@/types/record';
import { GridRow } from './GridRow';
import { GridHeader } from './GridHeader';
import { useSelectionStore } from '@/features/records/store/selectionStore';
import { useFocusStore } from '@/features/records/store/focusStore';

interface DataGridProps {
  records: ContentRecord[];
  onRowClick: (record: ContentRecord) => void;
}

const ROW_HEIGHT = 44; // Match the h-11 class (44px)

export function DataGrid({ records, onRowClick }: DataGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Selection store
  const { isSelected, toggle, selectAll, clearSelection, getSelectedIds } = useSelectionStore();

  // Focus store
  const { focusedIndex, setFocusedIndex, setFocusedId } = useFocusStore();

  // Virtual list
  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Update focused ID when focused index changes
  useEffect(() => {
    if (records[focusedIndex]) {
      setFocusedId(records[focusedIndex].id);
    }
  }, [focusedIndex, records, setFocusedId]);

  // Scroll to focused row when it changes
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < records.length) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, records.length, virtualizer]);

  // Handle row selection
  const handleSelect = useCallback(
    (id: string) => {
      toggle(id);
    },
    [toggle]
  );

  // Handle row focus
  const handleFocus = useCallback(
    (index: number) => {
      setFocusedIndex(index);
    },
    [setFocusedIndex]
  );

  // Handle row click (open drawer)
  const handleRowClick = useCallback(
    (record: ContentRecord) => {
      onRowClick(record);
    },
    [onRowClick]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === records.length) {
      clearSelection();
    } else {
      selectAll(records.map((r) => r.id));
    }
  }, [records, getSelectedIds, clearSelection, selectAll]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <GridHeader
        filteredCount={records.length}
        onSelectAll={handleSelectAll}
      />

      {/* Virtualized list container */}
      <div ref={parentRef} className="flex-1 overflow-auto" role="grid" aria-rowcount={records.length}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const record = records[virtualRow.index];
            return (
              <div
                key={record.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <GridRow
                  record={record}
                  index={virtualRow.index}
                  isFocused={focusedIndex === virtualRow.index}
                  isSelected={isSelected(record.id)}
                  onSelect={handleSelect}
                  onFocus={handleFocus}
                  onClick={() => handleRowClick(record)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
