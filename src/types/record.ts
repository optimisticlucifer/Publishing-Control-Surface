// Core status enum for content workflow
export type Status = 'Queued' | 'InReview' | 'Approved' | 'Published' | 'Blocked';

// Impact level for prioritization
export type Impact = 'High' | 'Medium' | 'Low';

// AI engines being tracked
export type Engine = 'ChatGPT' | 'Gemini' | 'Perplexity';

// Action types for state machine transitions
export type ActionType = 'review' | 'approve' | 'publish' | 'block';

// Core record interface
export interface ContentRecord {
  id: string;
  prompt: string;
  engine: Engine;
  status: Status;
  impact: Impact;
  safetyFlags: string[];
  updatedAt: string; // ISO date string
  blockReason?: string;
}

// Status transition rules
export interface StatusTransition {
  from: Status | Status[];
  to: Status;
  action: ActionType;
}

// Valid transitions in the state machine
export const TRANSITIONS: StatusTransition[] = [
  { from: 'Queued', to: 'InReview', action: 'review' },
  { from: 'InReview', to: 'Approved', action: 'approve' },
  { from: 'Approved', to: 'Published', action: 'publish' },
  { from: ['Queued', 'InReview', 'Approved', 'Published'], to: 'Blocked', action: 'block' },
];

// Get the next status for an action
export function getNextStatus(currentStatus: Status, action: ActionType): Status | null {
  const transition = TRANSITIONS.find((t) => {
    const fromMatches = Array.isArray(t.from)
      ? t.from.includes(currentStatus)
      : t.from === currentStatus;
    return fromMatches && t.action === action;
  });
  return transition?.to ?? null;
}

// Check if an action is valid for a given status
export function isValidAction(currentStatus: Status, action: ActionType): boolean {
  return getNextStatus(currentStatus, action) !== null;
}

// Filter configuration
export interface RecordFilters {
  status?: Status[];
  engine?: Engine[];
  impact?: Impact[];
  search?: string;
}

// Sort configuration
export type SortField = 'impact' | 'updatedAt' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// API response types
export interface MutationParams {
  recordId: string;
  action: ActionType;
  blockReason?: string;
}

export interface BatchMutationParams {
  recordIds: string[];
  action: ActionType;
  blockReason?: string;
}

export interface BatchResult {
  successful: ContentRecord[];
  failed: Array<{ recordId: string; error: string }>;
}

// Pending operation for optimistic updates
export interface PendingOperation {
  id: string;
  recordId: string;
  action: ActionType;
  previousStatus: Status;
  timestamp: number;
}
