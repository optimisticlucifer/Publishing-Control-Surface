import type {
  ContentRecord,
  RecordFilters,
  MutationParams,
  BatchMutationParams,
  BatchResult,
  ActionType,
  Status,
} from '@/types/record';
import { getNextStatus } from '@/types/record';
import { getMockRecords } from '@/lib/data/generateMockData';

// API configuration
const API_CONFIG = {
  minLatency: 300,
  maxLatency: 1200,
  failureRate: 0.08, // 8% failure rate
};

// Custom API error class
export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// Simulate network latency
function getRandomLatency(): number {
  return Math.floor(
    Math.random() * (API_CONFIG.maxLatency - API_CONFIG.minLatency) + API_CONFIG.minLatency
  );
}

// Simulate random failure
function shouldFail(): boolean {
  return Math.random() < API_CONFIG.failureRate;
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In-memory store (initialized from mock data)
let recordsStore: ContentRecord[] = [];

// Initialize store
function initializeStore(): void {
  if (recordsStore.length === 0) {
    recordsStore = [...getMockRecords()];
  }
}

// Apply filters to records
function applyFilters(records: ContentRecord[], filters?: RecordFilters): ContentRecord[] {
  let result = [...records];

  if (filters?.status?.length) {
    result = result.filter((r) => filters.status!.includes(r.status));
  }

  if (filters?.engine?.length) {
    result = result.filter((r) => filters.engine!.includes(r.engine));
  }

  if (filters?.impact?.length) {
    result = result.filter((r) => filters.impact!.includes(r.impact));
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter((r) => r.prompt.toLowerCase().includes(searchLower));
  }

  return result;
}

// Sort records by updatedAt only (most recent first) - impacts remain randomized
function sortRecords(records: ContentRecord[]): ContentRecord[] {
  return [...records].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

// Mock API object
export const mockApi = {
  // Initialize the store
  initialize: (): void => {
    initializeStore();
  },

  // Get all records (with optional filters)
  getRecords: async (filters?: RecordFilters): Promise<ContentRecord[]> => {
    initializeStore();
    // Minimal delay for initial load
    await delay(50);

    let result = applyFilters(recordsStore, filters);
    result = sortRecords(result);

    return result;
  },

  // Get a single record by ID
  getRecord: async (id: string): Promise<ContentRecord | null> => {
    initializeStore();
    await delay(50);

    return recordsStore.find((r) => r.id === id) ?? null;
  },

  // Update a single record (with latency and failure simulation)
  updateRecord: async (params: MutationParams): Promise<ContentRecord> => {
    initializeStore();

    // Simulate network latency
    await delay(getRandomLatency());

    // Simulate random failure
    if (shouldFail()) {
      throw new ApiError('Network error: Request failed. Please try again.', 'NETWORK_ERROR');
    }

    const recordIndex = recordsStore.findIndex((r) => r.id === params.recordId);
    if (recordIndex === -1) {
      throw new ApiError('Record not found', 'NOT_FOUND');
    }

    const record = recordsStore[recordIndex];
    const nextStatus = getNextStatus(record.status, params.action);

    if (!nextStatus) {
      throw new ApiError(
        `Invalid transition: Cannot ${params.action} a record with status "${record.status}"`,
        'INVALID_TRANSITION'
      );
    }

    // Update the record
    const updatedRecord: ContentRecord = {
      ...record,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      blockReason: params.action === 'block' ? params.blockReason : record.blockReason,
    };

    recordsStore[recordIndex] = updatedRecord;
    return updatedRecord;
  },

  // Batch update records
  batchUpdate: async (params: BatchMutationParams): Promise<BatchResult> => {
    initializeStore();

    const results: BatchResult = {
      successful: [],
      failed: [],
    };

    // Process each record individually (with individual failure simulation)
    const promises = params.recordIds.map(async (recordId) => {
      try {
        const record = await mockApi.updateRecord({
          recordId,
          action: params.action,
          blockReason: params.blockReason,
        });
        results.successful.push(record);
      } catch (error) {
        results.failed.push({
          recordId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(promises);
    return results;
  },

  // Get store stats (for debugging/testing)
  getStats: (): { total: number; byStatus: Record<Status, number> } => {
    initializeStore();

    const byStatus: Record<Status, number> = {
      Queued: 0,
      InReview: 0,
      Approved: 0,
      Published: 0,
      Blocked: 0,
    };

    recordsStore.forEach((r) => {
      byStatus[r.status]++;
    });

    return {
      total: recordsStore.length,
      byStatus,
    };
  },

  // Optimistic update helper - directly modify the store
  // (Used for immediate UI updates before API call completes)
  optimisticUpdate: (
    recordId: string,
    action: ActionType,
    blockReason?: string
  ): ContentRecord | null => {
    initializeStore();

    const recordIndex = recordsStore.findIndex((r) => r.id === recordId);
    if (recordIndex === -1) return null;

    const record = recordsStore[recordIndex];
    const nextStatus = getNextStatus(record.status, action);
    if (!nextStatus) return null;

    const updatedRecord: ContentRecord = {
      ...record,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      blockReason: action === 'block' ? blockReason : record.blockReason,
    };

    recordsStore[recordIndex] = updatedRecord;
    return updatedRecord;
  },

  // Rollback helper - restore a record to previous state
  rollback: (recordId: string, previousRecord: ContentRecord): void => {
    initializeStore();

    const recordIndex = recordsStore.findIndex((r) => r.id === recordId);
    if (recordIndex !== -1) {
      recordsStore[recordIndex] = previousRecord;
    }
  },
};

// Export for direct access (useful for optimistic updates)
export function getRecordsStore(): ContentRecord[] {
  initializeStore();
  return recordsStore;
}

export function setRecordsStore(records: ContentRecord[]): void {
  recordsStore = records;
}
