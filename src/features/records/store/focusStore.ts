import { create } from 'zustand';

interface FocusState {
  // Currently focused row index
  focusedIndex: number;

  // Currently focused record ID
  focusedId: string | null;

  // Whether the drawer is open
  isDrawerOpen: boolean;

  // ID of record shown in drawer
  drawerRecordId: string | null;

  // Whether drawer should animate (only on fresh open)
  shouldAnimateDrawer: boolean;

  // Actions
  setFocusedIndex: (index: number) => void;
  setFocusedId: (id: string | null) => void;
  moveFocus: (direction: 'up' | 'down', totalRows: number) => void;
  jumpToFirst: () => void;
  jumpToLast: (totalRows: number) => void;
  pageUp: (totalRows: number) => void;
  pageDown: (totalRows: number) => void;

  // Drawer actions
  openDrawer: (recordId: string) => void;
  closeDrawer: () => void;
  toggleDrawer: (recordId: string) => void;
  updateDrawerRecord: (recordId: string) => void;
}

const PAGE_SIZE = 20; // Number of rows to jump for page up/down

export const useFocusStore = create<FocusState>((set) => ({
  focusedIndex: 0,
  focusedId: null,
  isDrawerOpen: false,
  drawerRecordId: null,
  shouldAnimateDrawer: false,

  setFocusedIndex: (index) =>
    set(() => ({
      focusedIndex: index,
    })),

  setFocusedId: (id) =>
    set(() => ({
      focusedId: id,
    })),

  moveFocus: (direction, totalRows) =>
    set((state) => {
      const newIndex =
        direction === 'down'
          ? Math.min(state.focusedIndex + 1, totalRows - 1)
          : Math.max(state.focusedIndex - 1, 0);
      return { focusedIndex: newIndex };
    }),

  jumpToFirst: () =>
    set(() => ({
      focusedIndex: 0,
    })),

  jumpToLast: (totalRows) =>
    set(() => ({
      focusedIndex: Math.max(0, totalRows - 1),
    })),

  pageUp: (_totalRows) =>
    set((state) => ({
      focusedIndex: Math.max(0, state.focusedIndex - PAGE_SIZE),
    })),

  pageDown: (totalRows) =>
    set((state) => ({
      focusedIndex: Math.min(totalRows - 1, state.focusedIndex + PAGE_SIZE),
    })),

  openDrawer: (recordId) =>
    set((state) => ({
      isDrawerOpen: true,
      drawerRecordId: recordId,
      shouldAnimateDrawer: !state.isDrawerOpen, // Only animate if drawer was closed
    })),

  closeDrawer: () =>
    set(() => ({
      isDrawerOpen: false,
      drawerRecordId: null,
      shouldAnimateDrawer: false,
    })),

  toggleDrawer: (recordId) =>
    set((state) => {
      if (state.isDrawerOpen && state.drawerRecordId === recordId) {
        return { isDrawerOpen: false, drawerRecordId: null, shouldAnimateDrawer: false };
      }
      return { isDrawerOpen: true, drawerRecordId: recordId, shouldAnimateDrawer: !state.isDrawerOpen };
    }),

  updateDrawerRecord: (recordId) =>
    set(() => ({
      drawerRecordId: recordId,
      shouldAnimateDrawer: false, // No animation when just updating record
    })),
}));
