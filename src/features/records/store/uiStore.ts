import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Status, Engine, Impact, SortField, SortDirection } from '@/types/record';

interface UIState {
  // Filter state
  statusFilter: Status[];
  engineFilter: Engine[];
  impactFilter: Impact[];
  searchQuery: string;

  // Sort state
  sortField: SortField;
  sortDirection: SortDirection;

  // UI state
  isFilterBarOpen: boolean;
  isHelpModalOpen: boolean;

  // Theme
  theme: 'dark' | 'light';

  // Filter actions
  setStatusFilter: (statuses: Status[]) => void;
  setEngineFilter: (engines: Engine[]) => void;
  setImpactFilter: (impacts: Impact[]) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;

  // Sort actions
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;

  // UI actions
  toggleFilterBar: () => void;
  setFilterBarOpen: (open: boolean) => void;
  toggleHelpModal: () => void;
  setHelpModalOpen: (open: boolean) => void;

  // Theme actions
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial filter state
      statusFilter: [],
      engineFilter: [],
      impactFilter: [],
      searchQuery: '',

      // Initial sort state
      sortField: 'impact',
      sortDirection: 'desc',

      // Initial UI state
      isFilterBarOpen: false,
      isHelpModalOpen: false,

      // Initial theme (will be overridden by persisted value)
      theme: 'dark',

      // Filter actions
      setStatusFilter: (statuses) => set({ statusFilter: statuses }),
      setEngineFilter: (engines) => set({ engineFilter: engines }),
      setImpactFilter: (impacts) => set({ impactFilter: impacts }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      clearFilters: () =>
        set({
          statusFilter: [],
          engineFilter: [],
          impactFilter: [],
          searchQuery: '',
        }),

      hasActiveFilters: () => {
        const state = get();
        return (
          state.statusFilter.length > 0 ||
          state.engineFilter.length > 0 ||
          state.impactFilter.length > 0 ||
          state.searchQuery.length > 0
        );
      },

      // Sort actions
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (direction) => set({ sortDirection: direction }),
      toggleSortDirection: () =>
        set((state) => ({
          sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
        })),

      // UI actions
      toggleFilterBar: () => set((state) => ({ isFilterBarOpen: !state.isFilterBarOpen })),
      setFilterBarOpen: (open) => set({ isFilterBarOpen: open }),
      toggleHelpModal: () => set((state) => ({ isHelpModalOpen: !state.isHelpModalOpen })),
      setHelpModalOpen: (open) => set({ isHelpModalOpen: open }),

      // Theme actions
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          // Update document class for Tailwind
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(newTheme);
          return { theme: newTheme };
        }),

      setTheme: (theme) => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
        set({ theme });
      },
    }),
    {
      name: 'gravton-ui-storage',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);

// Initialize theme on load
export function initializeTheme(): void {
  const stored = localStorage.getItem('gravton-ui-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.theme) {
        document.documentElement.classList.add(state.theme);
        return;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Default to system preference or dark
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.add('dark');
  }
}
