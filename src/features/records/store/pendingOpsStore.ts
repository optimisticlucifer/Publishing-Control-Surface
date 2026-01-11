import { create } from 'zustand';
import type { ActionType, Status, PendingOperation } from '@/types/record';
import { nanoid } from 'nanoid';

interface PendingOpsState {
  // Map of record ID to array of pending operations
  operations: Map<string, PendingOperation[]>;

  // Check if a record has pending operations
  hasPendingOps: (recordId: string) => boolean;

  // Get the latest pending action for a record
  getLatestAction: (recordId: string) => ActionType | null;

  // Get all operations for a record
  getOperations: (recordId: string) => PendingOperation[];

  // Add a pending operation
  addOperation: (
    recordId: string,
    action: ActionType,
    previousStatus: Status
  ) => string; // Returns operation ID

  // Remove a completed operation
  removeOperation: (operationId: string, recordId: string) => void;

  // Clear all operations for a record
  clearOperations: (recordId: string) => void;

  // Get count of pending operations for a record
  getPendingCount: (recordId: string) => number;
}

export const usePendingOpsStore = create<PendingOpsState>((set, get) => ({
  operations: new Map(),

  hasPendingOps: (recordId) => {
    const ops = get().operations.get(recordId);
    return ops !== undefined && ops.length > 0;
  },

  getLatestAction: (recordId) => {
    const ops = get().operations.get(recordId);
    if (!ops || ops.length === 0) return null;
    return ops[ops.length - 1].action;
  },

  getOperations: (recordId) => {
    return get().operations.get(recordId) || [];
  },

  addOperation: (recordId, action, previousStatus) => {
    const operationId = nanoid();
    const operation: PendingOperation = {
      id: operationId,
      recordId,
      action,
      previousStatus,
      timestamp: Date.now(),
    };

    set((state) => {
      const newOps = new Map(state.operations);
      const existing = newOps.get(recordId) || [];
      newOps.set(recordId, [...existing, operation]);
      return { operations: newOps };
    });

    return operationId;
  },

  removeOperation: (operationId, recordId) =>
    set((state) => {
      const newOps = new Map(state.operations);
      const existing = newOps.get(recordId) || [];
      const filtered = existing.filter((op) => op.id !== operationId);

      if (filtered.length === 0) {
        newOps.delete(recordId);
      } else {
        newOps.set(recordId, filtered);
      }

      return { operations: newOps };
    }),

  clearOperations: (recordId) =>
    set((state) => {
      const newOps = new Map(state.operations);
      newOps.delete(recordId);
      return { operations: newOps };
    }),

  getPendingCount: (recordId) => {
    const ops = get().operations.get(recordId);
    return ops?.length ?? 0;
  },
}));
