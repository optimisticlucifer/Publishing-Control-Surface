import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/api/mockApi';
import { usePendingOpsStore } from '../store/pendingOpsStore';
import { useUIStore } from '../store/uiStore';
import type { ContentRecord, ActionType, RecordFilters } from '@/types/record';
import { getNextStatus } from '@/types/record';
import { toast } from 'sonner';

// Query keys
export const recordKeys = {
  all: ['records'] as const,
  lists: () => [...recordKeys.all, 'list'] as const,
  list: (filters: RecordFilters) => [...recordKeys.lists(), filters] as const,
  detail: (id: string) => [...recordKeys.all, 'detail', id] as const,
};

// Main records query hook
export function useRecords() {
  const { statusFilter, engineFilter, impactFilter, searchQuery } = useUIStore();

  const filters: RecordFilters = {
    status: statusFilter.length > 0 ? statusFilter : undefined,
    engine: engineFilter.length > 0 ? engineFilter : undefined,
    impact: impactFilter.length > 0 ? impactFilter : undefined,
    search: searchQuery || undefined,
  };

  return useQuery({
    queryKey: recordKeys.list(filters),
    queryFn: () => mockApi.getRecords(filters),
    staleTime: Infinity, // Data is client-side, never stale
    gcTime: Infinity, // Never garbage collect
  });
}

// Single record mutation hook
export function useRecordMutation() {
  const queryClient = useQueryClient();
  const { addOperation, removeOperation } = usePendingOpsStore();

  return useMutation({
    mutationFn: async (params: {
      recordId: string;
      action: ActionType;
      blockReason?: string;
    }) => {
      return mockApi.updateRecord(params);
    },

    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: recordKeys.all });

      // Get all query caches that might contain this record
      const queryCaches = queryClient.getQueriesData<ContentRecord[]>({
        queryKey: recordKeys.lists(),
      });

      // Find the record in any cache
      let previousRecord: ContentRecord | undefined;
      for (const [, data] of queryCaches) {
        if (data) {
          const record = data.find((r) => r.id === variables.recordId);
          if (record) {
            previousRecord = record;
            break;
          }
        }
      }

      if (!previousRecord) {
        throw new Error('Record not found');
      }

      // Track the pending operation
      const operationId = addOperation(
        variables.recordId,
        variables.action,
        previousRecord.status
      );

      // Calculate the new status
      const nextStatus = getNextStatus(previousRecord.status, variables.action);
      if (!nextStatus) {
        throw new Error('Invalid transition');
      }

      // Optimistically update all caches
      queryClient.setQueriesData<ContentRecord[]>(
        { queryKey: recordKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((r) => {
            if (r.id === variables.recordId) {
              return {
                ...r,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
                blockReason: variables.blockReason ?? r.blockReason,
              };
            }
            return r;
          });
        }
      );

      return { previousRecord, operationId };
    },

    onError: (_err, variables, context) => {
      // Rollback to previous state
      if (context?.previousRecord) {
        queryClient.setQueriesData<ContentRecord[]>(
          { queryKey: recordKeys.lists() },
          (old) => {
            if (!old) return old;
            return old.map((r) => {
              if (r.id === variables.recordId && context.previousRecord) {
                return context.previousRecord;
              }
              return r;
            });
          }
        );
      }

      // Clean up pending operation
      if (context?.operationId) {
        removeOperation(context.operationId, variables.recordId);
      }

      // Show error toast
      toast.error(`Failed to ${variables.action}`, {
        description: 'The action could not be completed. Please try again.',
      });
    },

    onSuccess: (_data, variables, context) => {
      // Clean up pending operation
      if (context?.operationId) {
        removeOperation(context.operationId, variables.recordId);
      }

      // Show success toast
      const actionLabels: Record<ActionType, string> = {
        review: 'Started review',
        approve: 'Approved',
        publish: 'Published',
        block: 'Blocked',
      };
      toast.success(actionLabels[variables.action], {
        description: `Record successfully ${variables.action}ed.`,
      });
    },

    onSettled: () => {
      // Optionally refetch to ensure consistency
      // queryClient.invalidateQueries({ queryKey: recordKeys.all });
    },
  });
}

// Batch mutation hook
export function useBatchMutation() {
  const queryClient = useQueryClient();
  const { addOperation, removeOperation } = usePendingOpsStore();

  return useMutation({
    mutationFn: async (params: {
      recordIds: string[];
      action: ActionType;
      blockReason?: string;
    }) => {
      return mockApi.batchUpdate(params);
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: recordKeys.all });

      const queryCaches = queryClient.getQueriesData<ContentRecord[]>({
        queryKey: recordKeys.lists(),
      });

      const previousRecords: Map<string, ContentRecord> = new Map();
      const operationIds: Map<string, string> = new Map();

      // Find and store previous state for each record
      for (const [, data] of queryCaches) {
        if (data) {
          for (const recordId of variables.recordIds) {
            const record = data.find((r) => r.id === recordId);
            if (record && !previousRecords.has(recordId)) {
              previousRecords.set(recordId, record);
              const opId = addOperation(recordId, variables.action, record.status);
              operationIds.set(recordId, opId);
            }
          }
        }
      }

      // Optimistically update all caches
      queryClient.setQueriesData<ContentRecord[]>(
        { queryKey: recordKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((r) => {
            if (variables.recordIds.includes(r.id)) {
              const nextStatus = getNextStatus(r.status, variables.action);
              if (nextStatus) {
                return {
                  ...r,
                  status: nextStatus,
                  updatedAt: new Date().toISOString(),
                  blockReason: variables.blockReason ?? r.blockReason,
                };
              }
            }
            return r;
          });
        }
      );

      return { previousRecords, operationIds };
    },

    onError: (_err, variables, context) => {
      // Rollback all records
      if (context?.previousRecords) {
        queryClient.setQueriesData<ContentRecord[]>(
          { queryKey: recordKeys.lists() },
          (old) => {
            if (!old) return old;
            return old.map((r) => {
              const previous = context.previousRecords.get(r.id);
              if (previous) {
                return previous;
              }
              return r;
            });
          }
        );
      }

      // Clean up pending operations
      if (context?.operationIds) {
        for (const [recordId, opId] of context.operationIds) {
          removeOperation(opId, recordId);
        }
      }

      toast.error(`Batch ${variables.action} failed`, {
        description: 'Some or all actions could not be completed.',
      });
    },

    onSuccess: (result, variables, context) => {
      // Clean up pending operations
      if (context?.operationIds) {
        for (const [recordId, opId] of context.operationIds) {
          removeOperation(opId, recordId);
        }
      }

      const successCount = result.successful.length;
      const failCount = result.failed.length;

      if (failCount === 0 && successCount > 0) {
        toast.success(`${successCount} items ${variables.action}ed`, {
          description: 'All actions completed successfully.',
        });
      } else if (successCount === 0 && failCount > 0) {
        // All failed - likely invalid transitions
        const actionRequires: Record<ActionType, string> = {
          review: 'Queued',
          approve: 'InReview',
          publish: 'Approved',
          block: 'any status',
        };
        toast.error(`Cannot ${variables.action}`, {
          description: `${variables.action} requires records in "${actionRequires[variables.action]}" status.`,
        });
      } else if (failCount > 0) {
        toast.warning(`Partially completed`, {
          description: `${successCount} succeeded, ${failCount} failed.`,
        });
      }
    },
  });
}
