# Phase 2: Zustand Store & CRUD Operations

## 🎯 Objectives
* Implement the centralized state store using Zustand in `src/store/boardStore.ts`.
* Implement custom localStorage persistence that debounces writes by **250ms** to prevent performance stuttering on rapid state updates.
* Write local mutations for card creation, updates, column renaming, card deletion (with confirmation states), and card movement.
* Build a remote action dispatcher (`applyRemoteAction`) that updates state without initiating a sync broadcast loop.

---

## 💻 Technical Checklist

### 1. Debounced Storage Driver
Zustand's default persist middleware executes writes synchronously on every set state call. We will wrap `localStorage` in a debouncing proxy.

```typescript
import { StateStorage } from 'zustand/middleware';

function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const rawStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: debounce((name, value) => {
    localStorage.setItem(name, value);
  }, 250),
  removeItem: (name) => localStorage.removeItem(name),
};
```

### 2. Store Actions
Actions must mutate local state *and* emit synchronization events.

* **Add Card**:
  * Generate a unique card ID (e.g. `crypto.randomUUID()`).
  * Add card to `state.cards` record.
  * Append card ID to target column's `cardIds` array.
* **Edit Card**:
  * Merge new values into `state.cards[cardId]`.
* **Delete Card**:
  * Remove card ID from column `cardIds`.
  * Delete key from `state.cards` record.
* **Rename Column**:
  * Update column title matching the column ID.
* **Move Card**:
  * Move card ID within a column or transfer to another column at a specific index.

### 3. Remote Action Handler (`applyRemoteAction`)
Handles external messages. Crucially, this action **must not** call the sync broadcaster, breaking potential circular execution loops.

```typescript
applyRemoteAction: (event: SyncAction) => {
  set((state) => {
    switch (event.type) {
      case 'ADD_CARD':
        // Add card to cards record and column arrays directly...
        break;
      case 'EDIT_CARD':
        // Merge updates...
        break;
      case 'DELETE_CARD':
        // Delete directly...
        break;
      case 'RENAME_COLUMN':
        // Rename directly...
        break;
      case 'MOVE_CARD':
        // Move card directly...
        break;
      case 'LOG_ACTION':
        // Append log directly...
        break;
    }
  });
}
```
---

## 🔒 Custom Deletion Confirmation
We must implement a clean inline prompt inside the Edit Panel for deletion:
* Click Delete button $\rightarrow$ Toggle state `isConfirming` to true.
* Render: `"Are you sure? [Yes, Delete] [Cancel]"` inline.
* Click Yes $\rightarrow$ Dispatch `deleteCard` action.
* Click Cancel $\rightarrow$ Reset state.
*(This avoids utilizing browser native `confirm()` dialogs)*.
