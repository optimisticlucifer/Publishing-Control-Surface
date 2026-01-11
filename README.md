# Gravton Publishing Control Surface

A high-performance, keyboard-centric dashboard for managing content approval workflows. Built for the Gravton Labs frontend engineering challenge.

![Gravton Logo](./src/assets/gravtonlabs_logo.jpeg)

## Features

- **3,000 Records** - Virtualized grid rendering 3k mock records efficiently
- **Keyboard-First** - Navigate entirely without a mouse (vim-style: j/k/g/G)
- **Optimistic UI** - Instant feedback with automatic rollback on failure
- **8% Failure Simulation** - Realistic API behavior with graceful error handling
- **Dual Theme** - Dark (default) and light mode with system preference detection
- **Batch Operations** - Select multiple records and apply actions at once

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | React 18 + Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Virtualization | TanStack Virtual |
| State | Zustand + TanStack Query |
| Notifications | Sonner |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gravton-control-surface.git

# Navigate to project directory
cd gravton-control-surface

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| `j` / `Arrow Down` | Move focus down |
| `k` / `Arrow Up` | Move focus up |
| `g` | Jump to first row |
| `G` | Jump to last row |
| `Page Up/Down` | Page navigation |

### Selection
| Key | Action |
|-----|--------|
| `x` / `Space` | Toggle selection |
| `Shift + j/k` | Extend selection |
| `Escape` | Clear selection |

### Actions
| Key | Action |
|-----|--------|
| `Enter` / `o` | Open review drawer |
| `r` | Start review (Queued -> InReview) |
| `a` | Approve (InReview -> Approved) |
| `p` | Publish (Approved -> Published) |
| `b` | Block (Any -> Blocked) |

### Batch Actions
| Key | Action |
|-----|--------|
| `Shift + A` | Approve all selected |
| `Shift + P` | Publish all selected |
| `Shift + B` | Block all selected |

### UI
| Key | Action |
|-----|--------|
| `/` | Focus search |
| `f` | Toggle filters |
| `t` | Toggle theme |
| `?` | Show keyboard shortcuts |

---

## Technical Defense

### 1. State Management Strategy

**Approach:** Hybrid architecture using Zustand for client-side UI state and TanStack Query for server state.

**Why this combination:**

- **Zustand** handles ephemeral UI state (selection, focus, pending operations) with minimal boilerplate. Each concern is isolated in its own store:
  - `selectionStore` - tracks selected row IDs using a Set for O(1) lookups
  - `focusStore` - manages keyboard focus index and drawer state
  - `pendingOpsStore` - tracks in-flight mutations for optimistic UI indicators

- **TanStack Query** manages server state (records cache) with built-in optimistic update patterns. The `onMutate`/`onError`/`onSuccess` lifecycle provides:
  - Automatic snapshot before mutations
  - Rollback on failure
  - Cache synchronization

**Scaling to 50k records:**

The current architecture scales well because:

1. **Virtualization renders only ~20 visible rows** regardless of dataset size - O(1) render complexity
2. **Selection uses Set<string>** - O(1) add/remove/lookup operations
3. **Filtering is lazy** - Only computed when filters change, not on every render
4. **For 50k+**, we would add:
   - Web Worker for off-main-thread filtering/sorting
   - Indexed storage (IndexedDB) for persistence
   - Pagination or cursor-based loading for real API integration

### 2. Virtualization Trade-offs

**Approach:** TanStack Virtual with fixed 44px row heights.

**Benefits:**
- Constant memory footprint regardless of dataset size
- Smooth 60fps scrolling with 3k+ rows
- 5-row overscan buffer prevents flicker during scroll

**Trade-offs:**

1. **Ctrl+F Browser Search:**
   - **Problem:** Only ~25 rows are in the DOM at any time; Ctrl+F only finds visible content
   - **Mitigation:** Custom search input (`/` shortcut) filters at the data level before virtualization
   - **Alternative considered:** Render all rows invisibly for search, rejected due to memory cost

2. **Variable Row Heights:**
   - **Problem:** Current implementation assumes fixed 44px rows
   - **Impact:** Safety flags that wrap would be truncated (we show max 2 flags + "+N")
   - **Solution if needed:** TanStack Virtual supports `measureElement` for dynamic heights, but requires:
     - Initial render pass to measure
     - More complex scroll position calculations
     - Slight performance cost

3. **Accessibility:**
   - Virtual rows maintain `aria-rowindex` for screen readers
   - Focus management ensures keyboard navigation works correctly
   - Trade-off: Screen reader "browse mode" may not see all content

### 3. The "Sync" Problem - Race Condition Handling

**Problem Scenario:**
```
t=0ms    User clicks "Approve" on Record A
t=50ms   User immediately clicks "Block" on Record A (before Approve completes)
t=800ms  Approve API returns success
t=1100ms Block API returns success
```

**Solution: Pending Operations Store**

The `pendingOpsStore` maintains a Map of `recordId -> PendingOperation[]`:

```typescript
interface PendingOperation {
  id: string;           // Unique operation ID
  recordId: string;     // Target record
  action: ActionType;   // approve/block/publish
  previousStatus: Status; // For rollback
  timestamp: number;    // Ordering
}
```

**How conflicts are handled:**

1. **Sequential Processing:** Each mutation is tracked independently with its own `operationId`
2. **Last-Write-Wins for UI:** The most recent action's expected state is shown optimistically
3. **Independent Rollback:** If Approve fails but Block succeeds, only Approve rolls back
4. **Eventual Consistency:** `onSettled` callback can invalidate queries to reconcile with server truth

**Example flow:**
```
1. Click Approve:
   - Add operation {id: "op1", action: "approve", previousStatus: "InReview"}
   - Update UI to show "Approved"

2. Click Block (while Approve pending):
   - Add operation {id: "op2", action: "block", previousStatus: "InReview"}
   - Update UI to show "Blocked"

3. Approve returns success:
   - Remove op1 from pending
   - UI still shows "Blocked" (latest optimistic state)

4. Block returns success:
   - Remove op2 from pending
   - Final state: "Blocked" (matches UI)
```

**Edge case - Approve succeeds, Block fails:**
```
3. Approve returns success: UI shows Blocked, server has Approved
4. Block returns failure:
   - Rollback using op2.previousStatus ("InReview")
   - But wait - server actually has "Approved"!
   - Solution: Query invalidation in onSettled reconciles to server truth
```

This approach prioritizes responsive UX while maintaining eventual consistency. The 8% simulated failure rate ensures users regularly experience graceful error recovery.

---

## Project Structure

```
src/
├── components/
│   ├── grid/           # DataGrid, GridRow, GridHeader, SelectionBar
│   ├── drawer/         # ReviewDrawer
│   ├── filters/        # FilterBar, SearchInput
│   └── ui/             # Header, StatusBar, HelpModal
├── features/
│   └── records/
│       ├── hooks/      # useRecords, useRecordMutation, useBatchMutation
│       └── store/      # selectionStore, focusStore, pendingOpsStore, uiStore
├── lib/
│   ├── api/            # mockApi with latency/failure simulation
│   ├── data/           # generateMockData (3k records)
│   └── keyboard/       # KeyboardProvider
├── types/              # TypeScript interfaces
└── styles/             # Tailwind configuration
```

## License

MIT
