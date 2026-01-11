import { create } from 'zustand';

interface SelectionState {
  // Selected record IDs
  selectedIds: Set<string>;

  // Last selected ID (for shift-click range selection)
  lastSelectedId: string | null;

  // Actions
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectRange: (toId: string, orderedIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedCount: () => number;
  getSelectedIds: () => string[];
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: new Set(),
  lastSelectedId: null,

  select: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      newSelected.add(id);
      return { selectedIds: newSelected, lastSelectedId: id };
    }),

  deselect: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      newSelected.delete(id);
      return { selectedIds: newSelected };
    }),

  toggle: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedIds: newSelected, lastSelectedId: id };
    }),

  selectRange: (toId, orderedIds) =>
    set((state) => {
      const fromId = state.lastSelectedId;
      if (!fromId) {
        const newSelected = new Set(state.selectedIds);
        newSelected.add(toId);
        return { selectedIds: newSelected, lastSelectedId: toId };
      }

      const fromIndex = orderedIds.indexOf(fromId);
      const toIndex = orderedIds.indexOf(toId);

      if (fromIndex === -1 || toIndex === -1) {
        return state;
      }

      const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];

      const newSelected = new Set(state.selectedIds);
      for (let i = start; i <= end; i++) {
        newSelected.add(orderedIds[i]);
      }

      return { selectedIds: newSelected, lastSelectedId: toId };
    }),

  selectAll: (ids) =>
    set(() => ({
      selectedIds: new Set(ids),
      lastSelectedId: ids.length > 0 ? ids[ids.length - 1] : null,
    })),

  clearSelection: () =>
    set(() => ({
      selectedIds: new Set(),
      lastSelectedId: null,
    })),

  isSelected: (id) => get().selectedIds.has(id),

  getSelectedCount: () => get().selectedIds.size,

  getSelectedIds: () => Array.from(get().selectedIds),
}));
