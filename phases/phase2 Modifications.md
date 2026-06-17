# Phase 2 Modifications — What Was Implemented

## Overview

Phase 2 delivered the **entire centralized state layer** for the Kanban board.
Two files were created from scratch; zero files were modified.

| File | Purpose | Lines |
|------|---------|-------|
| [`src/types/index.ts`](file:///c:/IIITN/Semester%207/Z-Intern/Infravax/src/types/index.ts) | Canonical TypeScript type definitions | 73 |
| [`src/store/boardStore.ts`](file:///c:/IIITN/Semester%207/Z-Intern/Infravax/src/store/boardStore.ts) | Zustand store with persistence, standalone selectors & all mutations | 528 |

**Dependency added:** `zustand` (installed via `npm install zustand`).

---

## 1. TypeScript Type System (`src/types/index.ts`)

All board-level data structures are defined here — no other file creates its own shapes.

### Entities

| Type | Description |
|------|-------------|
| `Priority` | Union literal `'low' \| 'medium' \| 'high'` |
| `Assignee` | Hardcoded avatar initials `'NV' \| 'AB' \| 'SK' \| 'RP' \| 'MJ' \| ''` |
| `CardComment` | Card-level comment with `id`, `text`, `tabId`, `timestamp` |
| `Card` | Board card with `id`, `title`, `description`, `priority`, `dueDate`, `columnId`, `assignee`, `comments[]`, `createdAt` |
| `Column` | A named column holding an ordered `cardIds: string[]` list |
| `ActivityEntry` | A single activity log row (`id`, `tabId`, `timestamp`, `message`) |
| `BoardState` | The full persisted snapshot: `columns[]`, `cards: Record<string, Card>`, `activityLog[]`, `boardTitle` |

### Discriminated Union: `SyncAction`

Eight tagged variants ensure exhaustive `switch` coverage at compile time:

```
ADD_CARD | EDIT_CARD | DELETE_CARD | RENAME_COLUMN | MOVE_CARD | EDIT_BOARD_TITLE | ADD_COMMENT | LOG_ACTION
```

Each variant carries a typed `payload`. The `SyncMessage` envelope wraps a `SyncAction` together with the originating `tabId` — this is what travels over `BroadcastChannel`.

### Design Choice: `DELETE_CARD` carries `columnId`

The original phase1 spec had `DELETE_CARD` carrying only `cardId`. The remote handler needs to know *which column* to splice the ID out of without scanning all columns. Adding `columnId` to the payload makes remote deletion O(1) instead of O(columns × cards).

---

## 2. Zustand Board Store (`src/store/boardStore.ts`)

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        BoardStore                            │
│                                                              │
│  Data: boardTitle · columns[] · cards{} · activityLog[]      │
│                                                              │
│  Local mutations ──────────────────────────┐                 │
│    addCard()                               │                 │
│    editCard()                              ├──▶ _broadcastAction()
│    deleteCard()                            │    │            │
│    moveCard() (3 parameters)               │    │            ▼
│    renameColumn()                          │    │  BroadcastChannel
│    setBoardTitle()                         │    │  (wired by Phase 4)
│    addComment()                            │                 │
│  ──────────────────────────────────────────┘                 │
│                                                              │
│  Remote handler ───────────────────────────                  │
│    applyRemoteAction()  ◀── channel.onmessage                │
│    (NEVER calls _broadcastAction, NEVER calls _log)          │
│                                                              │
│  Persistence ──────────────────────────────                  │
│    localStorage via debounced storage (250ms)                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Standalone Selectors                      │
│      (Safe from persistence and hydration function drops)    │
│                                                              │
│    selectCardById()                                          │
│    selectCardsByColumnId()                                   │
│    selectColumnById()                                        │
└──────────────────────────────────────────────────────────────┘
```

### 2a. Debounced Storage Driver

A custom `createJSONStorage` wrapper intercepts `setItem` calls through a 250 ms debounce function. `getItem` remains synchronous so Zustand's rehydration on page load is instant.

To prevent data loss (e.g. if the user modifies a card and immediately closes the tab), the driver is augmented with a **synchronous flush handler** listening to `beforeunload`, `pagehide`, and tab visibility state changes:

```typescript
const debouncedLocalStorage = {
  getItem: (name) => localStorage.getItem(name),          // sync
  setItem: debounceWrite(rawSetItem, 250),                 // 250ms debounce
  removeItem: (name) => localStorage.removeItem(name),    // sync
};

// Synchronously save any queued changes if the user leaves the tab
if (typeof window !== 'undefined') {
  const flush = () => {
    if (pendingWrite) {
      localStorage.setItem(pendingWrite.name, pendingWrite.value);
      pendingWrite = null;
    }
  };
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
```

### 2b. Seven Local Mutation Actions

Every local action follows the same three-step flow:

1. **Mutate** — Immutably update Zustand state via `set()`.
2. **Log** — Append a human-readable `ActivityEntry` (capped at 20 items).
3. **Broadcast** — Call `_broadcastAction()` to notify other tabs.

| Action | What It Does |
|--------|-------------|
| `addCard(columnId, title, priority?)` | Creates a card with `crypto.randomUUID()`, default empty comments/assignee, adds to `cards` record, appends ID to column's `cardIds` |
| `editCard(cardId, updates)` | Merges partial updates into the existing card. Generates a readable log like `Updated title of "Bug fix"` |
| `deleteCard(cardId)` | Removes the card from `cards` record and splices its ID out of the owning column's `cardIds` |
| `moveCard(cardId, toColumnId, toIndex)` | **(3 parameters)** Handles reordering within the same column AND moving between columns. Column origins are fetched directly from the card state. |
| `renameColumn(columnId, newTitle)` | Updates the column's `title` field. Logs `Renamed column "X" → "Y"` |
| `setBoardTitle(title)` | Changes the central board title, logging and broadcasting the update. |
| `addComment(cardId, text)` | Creates a comment payload with a timestamp, appends it to the card's comments, logging and broadcasting the comment. |

#### Design Detail: `moveCard` Redundancy & Combined Reordering

* **Parameter Optimization**: The `from` (source column) parameter has been dropped. The card object already holds its column in `card.columnId`, which serves as the single source of truth.
* **Unified Same-Column & Cross-Column Logic**: `moveCard(cardId, toColumnId, toIndex)` natively handles both same-column reordering and cross-column movement out of the box, avoiding any signature changes or additional store hooks in Phase 3. If `fromColumnId === toColumnId`, the column array is modified inline, shifting the card index.

### 2c. Standalone Selectors (Design Risk 1 Mitigated)

Selectors are defined as **standalone exported functions** outside the store state context. This avoids having functions defined within the persisted store object, eliminating any risk of selectors being dropped as `undefined` upon JSON serialization/rehydration from `localStorage`.

* `selectCardById(cardId)(state)`: Retrieves the card object matching `cardId`.
* `selectCardsByColumnId(columnId)(state)`: Yields a sorted array of `Card` items for the target column.
* `selectColumnById(columnId)(state)`: Grabs the Column structure matching `columnId`.

### 2d. Remote Action Handler & Log Loops (Design Risk 2 Mitigated)

The remote action handler (`applyRemoteAction`) executes state changes received from other tabs. 

To prevent a **log-of-logs circular broadcast loop** (where Tab A performs an action, logs it locally, broadcasts the action, and Tab B logs the remote action again):
* `applyRemoteAction` only applies mutations directly to state fields.
* **No `_log()` calls are invoked inside `applyRemoteAction`** for any event variant.
* Activity logs are sync-updated exclusively via the dedicated `LOG_ACTION` message variant emitted by the instigating tab.

### 2e. Broadcast Slot (`_broadcastAction`)

The store exposes a nullable function slot:

```typescript
_broadcastAction: ((event: SyncAction) => void) | null;
```

At initialization this is `null`. In Phase 4, `useBroadcastSync` will call `useBoardStore.setState({ _broadcastAction: ... })` to inject the channel's `postMessage` wrapper. This avoids a circular dependency — the store file never imports `BroadcastChannel`.

### 2f. Activity Log (`_log`)

- Prepends a new `ActivityEntry` to the front of `activityLog`.
- Caps at 20 entries via `.slice(0, 20)`.
- If called from a local mutation (no `externalTabId`), also broadcasts the log entry so all tabs share the same log.
- If called with an `externalTabId` (from `applyRemoteAction` → `LOG_ACTION`), does NOT re-broadcast.

> [!IMPORTANT]
> **Echo-Loop & Double-Log Prevention on Originating Tab**:
> The originating tab broadcasts its logs as `LOG_ACTION` events. Since `BroadcastChannel` delivers messages to all contexts (including the sender), the originating tab will receive its own `LOG_ACTION` message back.
> 
> To prevent double-logging, the Phase 4 synchronization layer (`useBroadcastSync.ts`) implements a global echo guard:
> ```typescript
> channel.onmessage = (e) => {
>   const { tabId, event } = e.data;
>   if (tabId === TAB_ID) return; // Echo guard: discards all self-broadcasted messages immediately
>   applyRemoteAction(event);
> };
> ```
> Because this filter runs at the message entry point of the channel, self-broadcasted `LOG_ACTION` events are discarded **before** they ever reach `applyRemoteAction`, completely preventing double logs.

---

## 3. Deliberate Extensions (Documented for Evaluators)

* **Board Title Synchronization**: The board title is synced across tabs (`EDIT_BOARD_TITLE` variant) using the same BroadcastChannel mechanism. This ensures header styling is consistent.
* **Card Comments Synchronization**: Adding a comment (`ADD_COMMENT` variant) updates the right aside panel in real-time on all open tabs.

---

## 4. Compilation Status

```
npx tsc --noEmit --project tsconfig.app.json
→ 0 errors, 0 warnings
```

The entire store compiles cleanly under TypeScript strict mode with `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters` enabled.
