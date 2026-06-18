// ─────────────────────────────────────────────────────────────
// src/store/boardStore.ts
// Single Zustand store — the one and only source of truth for
// ALL board data. No component should own board state via useState.
//
// Design decisions:
//   • Cards are flat in a Record<string, Card> → O(1) edits.
//   • Columns hold ordered cardIds[] → O(n) reorder only when
//     cards move, which is infrequent.
//   • _broadcastAction is a slot that the sync hook fills after
//     mount. The store itself never imports BroadcastChannel.
//   • applyRemoteAction mirrors every local mutation but NEVER
//     calls _broadcastAction → structural echo-loop prevention.
//   • localStorage writes are debounced by 250 ms via a custom
//     StateStorage wrapper to avoid write-thrashing during drag.
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Card,
  CardComment,
  Column,
  ActivityEntry,
  SyncAction,
  Priority,
} from '../types';
import { TAB_ID } from '../sync/tabId';

// ── Helpers ─────────────────────────────────────────────────

/** Generate a unique ID. Falls back to Math.random if crypto is unavailable. */
function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Debounced localStorage driver ───────────────────────────

// Track any pending write to flush on page unload/hide
let pendingWrite: { name: string; value: string } | null = null;

function debounceWrite(fn: (name: string, value: string) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (name: string, value: string) => {
    pendingWrite = { name, value };
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(name, value);
      pendingWrite = null;
    }, delay);
  };
}

const rawSetItem = (name: string, value: string) => {
  localStorage.setItem(name, value);
};

const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

export function sortCardIds(cardIds: string[], cards: Record<string, Card>): string[] {
  return [...cardIds].sort((a, b) => {
    const cardA = cards[a];
    const cardB = cards[b];
    if (!cardA || !cardB) return 0;

    const priA = priorityOrder[cardA.priority || 'medium'] || 0;
    const priB = priorityOrder[cardB.priority || 'medium'] || 0;

    return priB - priA; // Descending: high -> medium -> low
  });
}

const debouncedLocalStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name);
  },
  setItem: debounceWrite(rawSetItem, 250),
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
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
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
}

// ── Default board seed ──────────────────────────────────────

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-todo', title: 'To Do', cardIds: [] },
  { id: 'col-in-progress', title: 'In Progress', cardIds: [] },
  { id: 'col-in-review', title: 'In Review', cardIds: [] },
  { id: 'col-done', title: 'Done', cardIds: [] },
];

const DEFAULT_BOARD_TITLE = 'Kanban Board';

// ── Store shape ─────────────────────────────────────────────

interface BoardStore {
  // ── Data ──────────────────────────────────────────────────
  boardTitle: string;
  columns: Column[];
  cards: Record<string, Card>;
  activityLog: ActivityEntry[];
  inTransitCardIds: string[];
  autoSortEnabled: boolean;
  editingCardIds: string[];

  // ── Local mutations (broadcast + log) ─────────────────────
  addCard: (columnId: string, title: string, priority?: Priority, category?: string, progress?: number, attachmentsCount?: number) => void;
  editCard: (cardId: string, updates: Partial<Omit<Card, 'id'>>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, toColumnId: string, toIndex: number, skipLog?: boolean, originalFromColumnId?: string | null) => void;
  renameColumn: (columnId: string, newTitle: string) => void;
  setBoardTitle: (title: string) => void;
  addComment: (cardId: string, text: string) => void;
  setTransitCard: (cardId: string, isTransit: boolean) => void;
  setAutoSortEnabled: (enabled: boolean) => void;
  setEditingCard: (cardId: string, isEditing: boolean) => void;

  // ── Board reset ───────────────────────────────────────────
  resetBoard: () => void;
  clearActivityLog: () => void;

  // ── Remote action handler (NO broadcast, NO echo) ─────────
  applyRemoteAction: (event: SyncAction) => void;

  // ── Internal: filled by the sync hook after mount ─────────
  _broadcastAction: ((event: SyncAction) => void) | null;

  // ── Internal: append to activity log ──────────────────────
  _log: (message: string, tabId?: string) => void;
}

// ── Store implementation ────────────────────────────────────

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      // ── Initial data ────────────────────────────────────────
      boardTitle: DEFAULT_BOARD_TITLE,
      columns: DEFAULT_COLUMNS,
      cards: {},
      activityLog: [],
      inTransitCardIds: [],
      autoSortEnabled: false,
      editingCardIds: [],

      // ── Broadcast slot (wired by useBroadcastSync) ──────────
      _broadcastAction: null,

      // ── Activity log helper ─────────────────────────────────
      _log: (message: string, externalTabId?: string) => {
        const entry: ActivityEntry = {
          id: uid(),
          tabId: externalTabId ?? TAB_ID,
          timestamp: Date.now(),
          message,
        };
        set((state) => ({
          activityLog: [entry, ...state.activityLog].slice(0, 20),
        }));

        // Also broadcast the log entry so other tabs update their logs
        const bc = get()._broadcastAction;
        if (bc && !externalTabId) {
          bc({ type: 'LOG_ACTION', payload: { entry } });
        }
      },

      // ────────────────────────────────────────────────────────
      //  LOCAL MUTATIONS
      //  Each one: (1) mutates state, (2) logs, (3) broadcasts.
      // ────────────────────────────────────────────────────────

      addCard: (
        columnId: string,
        title: string,
        priority: Priority = 'medium',
        category?: string,
        progress?: number,
        attachmentsCount?: number
      ) => {
        const card: Card = {
          id: uid(),
          title,
          description: '',
          priority,
          category,
          progress,
          attachmentsCount,
          dueDate: null,
          columnId,
          assignee: '',
          comments: [],
          createdAt: Date.now(),
        };

        set((state) => {
          const columns = state.columns.map((col) =>
            col.id === columnId
              ? { ...col, cardIds: [...col.cardIds, card.id] }
              : col,
          );
          return {
            columns,
            cards: { ...state.cards, [card.id]: card },
          };
        });

        const colTitle = get().columns.find((c) => c.id === columnId)?.title ?? columnId;
        get()._log(`Created card "${title}" in "${colTitle}"`);
        get()._broadcastAction?.({
          type: 'ADD_CARD',
          payload: { columnId, card },
        });
      },

      editCard: (cardId: string, updates: Partial<Omit<Card, 'id'>>) => {
        const existing = get().cards[cardId];
        if (!existing) return;

        set((state) => ({
          cards: {
            ...state.cards,
            [cardId]: { ...state.cards[cardId], ...updates },
          },
        }));

        if (updates.priority !== undefined && updates.priority !== existing.priority) {
          if (get().autoSortEnabled) {
            setTimeout(() => {
              set((state) => ({
                columns: state.columns.map((col) =>
                  col.id === existing.columnId
                    ? { ...col, cardIds: sortCardIds(col.cardIds, state.cards) }
                    : col
                )
              }));
            }, 400); // shorter delay for edits since no drop animation precedes it
          }
        }

        // Determine a human-readable summary of what changed
        const fields = Object.keys(updates) as (keyof typeof updates)[];
        const summary = fields.length === 1
          ? `Updated ${fields[0]} of "${existing.title}"`
          : `Edited "${existing.title}"`;

        get()._log(summary);
        get()._broadcastAction?.({
          type: 'EDIT_CARD',
          payload: { cardId, updates },
        });
      },

      deleteCard: (cardId: string) => {
        const card = get().cards[cardId];
        if (!card) return;

        set((state) => {
          const columns = state.columns.map((col) =>
            col.id === card.columnId
              ? { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) }
              : col,
          );
          const { [cardId]: _removed, ...remainingCards } = state.cards;
          void _removed; // suppress unused-variable lint
          return { columns, cards: remainingCards };
        });

        const colTitle = get().columns.find((c) => c.id === card.columnId)?.title ?? card.columnId;
        get()._log(`Deleted card "${card.title}" from "${colTitle}"`);
        get()._broadcastAction?.({
          type: 'DELETE_CARD',
          payload: { cardId, columnId: card.columnId },
        });
      },

      moveCard: (
        cardId: string,
        toColumnId: string,
        toIndex: number,
        skipLog?: boolean,
        originalFromColumnId?: string | null
      ) => {
        const card = get().cards[cardId];
        if (!card) return;

        // Guard: reject invalid target column or negative index
        if (!toColumnId || toIndex < 0) return;
        const targetExists = get().columns.some((c) => c.id === toColumnId);
        if (!targetExists) return;

        const fromColumnId = card.columnId;

        set((state) => {
          // Deep-clone columns and remove card from ALL columns to fix any glitch state
          const columns = state.columns.map((col) => ({
            ...col,
            cardIds: col.cardIds.filter(id => id !== cardId)
          }));

          // (already removed from source during deep-clone filter above)

          // Insert into target column at the requested index
          const dstCol = columns.find((c) => c.id === toColumnId);
          if (dstCol) {
            const clampedIndex = Math.max(0, Math.min(toIndex, dstCol.cardIds.length));
            dstCol.cardIds.splice(clampedIndex, 0, cardId);
          }

          // Update the card's own columnId reference
          const updatedCard = { ...state.cards[cardId], columnId: toColumnId };

          return {
            columns,
            cards: { ...state.cards, [cardId]: updatedCard },
          };
        });

        // Delayed sort — fires after drop animation completes, only if enabled
        if (get().autoSortEnabled) {
          setTimeout(() => {
            set((state) => ({
              columns: state.columns.map((col) =>
                col.id === toColumnId
                  ? { ...col, cardIds: sortCardIds(col.cardIds, state.cards) }
                  : col
              )
            }));
          }, 800); // 800ms — after your 600ms useSortable transition finishes
        }

        if (!skipLog) {
          const actualFromColumnId = originalFromColumnId || fromColumnId;
          const fromTitle = get().columns.find((c) => c.id === actualFromColumnId)?.title ?? actualFromColumnId;
          const toTitle = get().columns.find((c) => c.id === toColumnId)?.title ?? toColumnId;

          if (actualFromColumnId === toColumnId) {
            get()._log(`Reordered "${card.title}" in "${toTitle}"`);
          } else {
            get()._log(`Card "${card.title}" moved from "${fromTitle}" to "${toTitle}"`);
          }

          get()._broadcastAction?.({
            type: 'MOVE_CARD',
            payload: { cardId, fromColumnId: actualFromColumnId, toColumnId, toIndex },
          });
        }
      },

      renameColumn: (columnId: string, newTitle: string) => {
        const oldTitle = get().columns.find((c) => c.id === columnId)?.title;
        if (oldTitle === undefined) return;

        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, title: newTitle } : col,
          ),
        }));

        get()._log(`Renamed column "${oldTitle}" → "${newTitle}"`);
        get()._broadcastAction?.({
          type: 'RENAME_COLUMN',
          payload: { columnId, title: newTitle },
        });
      },

      setBoardTitle: (title: string) => {
        const oldTitle = get().boardTitle;
        if (oldTitle === title) return;

        set({ boardTitle: title });

        get()._log(`Board title changed to "${title}"`);
        get()._broadcastAction?.({
          type: 'EDIT_BOARD_TITLE',
          payload: { title },
        });
      },

      addComment: (cardId: string, text: string) => {
        const card = get().cards[cardId];
        if (!card) return;

        const comment: CardComment = {
          id: uid(),
          text,
          tabId: TAB_ID,
          timestamp: Date.now(),
        };

        set((state) => ({
          cards: {
            ...state.cards,
            [cardId]: {
              ...state.cards[cardId],
              comments: [...state.cards[cardId].comments, comment],
            },
          },
        }));

        get()._log(`Commented on "${card.title}"`);
        get()._broadcastAction?.({
          type: 'ADD_COMMENT',
          payload: { cardId, comment },
        });
      },

      setTransitCard: (cardId, isTransit) => {
        set((state) => {
          const newSet = new Set(state.inTransitCardIds);
          if (isTransit) newSet.add(cardId);
          else newSet.delete(cardId);
          return { inTransitCardIds: Array.from(newSet) };
        });
        get()._broadcastAction?.({ type: 'SET_TRANSIT', payload: { cardId, isTransit } });
      },

      setAutoSortEnabled: (enabled: boolean) => {
        set((state) => {
          if (enabled) {
            // Sort all columns immediately when toggled on
            const columns = state.columns.map(col => ({
              ...col,
              cardIds: sortCardIds(col.cardIds, state.cards)
            }));
            return { autoSortEnabled: enabled, columns };
          }
          return { autoSortEnabled: enabled };
        });
        // Optionally broadcast this setting if we want it synced across tabs
        get()._broadcastAction?.({
          type: 'SET_AUTO_SORT',
          payload: { enabled },
        });
      },

      setEditingCard: (cardId, isEditing) => {
        set((state) => {
          const newSet = new Set(state.editingCardIds);
          if (isEditing) newSet.add(cardId);
          else newSet.delete(cardId);
          return { editingCardIds: Array.from(newSet) };
        });
        get()._broadcastAction?.({ type: 'SET_EDITING', payload: { cardId, isEditing } });
      },

      // ── Board reset / clear ─────────────────────────────────
      resetBoard: () => {
        set({
          boardTitle: DEFAULT_BOARD_TITLE,
          columns: DEFAULT_COLUMNS.map((c) => ({ ...c, cardIds: [] })),
          cards: {},
          activityLog: [],
        });
      },

      clearActivityLog: () => {
        set({ activityLog: [] });
      },

      // ────────────────────────────────────────────────────────
      //  REMOTE ACTION HANDLER
      //  Called by useBroadcastSync when a message arrives from
      //  another tab. Mirrors local mutations but NEVER calls
      //  _broadcastAction → no echo loop is possible.
      // ────────────────────────────────────────────────────────

      applyRemoteAction: (event: SyncAction) => {
        switch (event.type) {
          case 'ADD_CARD': {
            const { columnId, card } = event.payload;
            set((state) => ({
              columns: state.columns.map((col) =>
                col.id === columnId
                  ? { ...col, cardIds: [...col.cardIds, card.id] }
                  : col,
              ),
              cards: { ...state.cards, [card.id]: card },
            }));
            break;
          }

          case 'EDIT_CARD': {
            const { cardId, updates } = event.payload;
            set((state) => {
              if (!state.cards[cardId]) return state;
              return {
                cards: {
                  ...state.cards,
                  [cardId]: { ...state.cards[cardId], ...updates },
                },
              };
            });
            break;
          }

          case 'DELETE_CARD': {
            const { cardId, columnId } = event.payload;
            set((state) => {
              const columns = state.columns.map((col) =>
                col.id === columnId
                  ? { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) }
                  : col,
              );
              const { [cardId]: _removed, ...remainingCards } = state.cards;
              void _removed;
              return { columns, cards: remainingCards };
            });
            break;
          }

          case 'RENAME_COLUMN': {
            const { columnId, title } = event.payload;
            set((state) => ({
              columns: state.columns.map((col) =>
                col.id === columnId ? { ...col, title } : col,
              ),
            }));
            break;
          }

          case 'MOVE_CARD': {
            const { cardId, toColumnId, toIndex } = event.payload;
            set((state) => {
              const columns = state.columns.map((col) => ({
                ...col,
                cardIds: col.cardIds.filter((id) => id !== cardId),
              }));

              const dstCol = columns.find((c) => c.id === toColumnId);
              if (dstCol) {
                const clampedIndex = Math.min(toIndex, dstCol.cardIds.length);
                dstCol.cardIds.splice(clampedIndex, 0, cardId);
              }

              const updatedCard = state.cards[cardId]
                ? { ...state.cards[cardId], columnId: toColumnId }
                : undefined;

              return {
                columns,
                cards: updatedCard
                  ? { ...state.cards, [cardId]: updatedCard }
                  : state.cards,
              };
            });
            break;
          }

          case 'EDIT_BOARD_TITLE': {
            const { title } = event.payload;
            set({ boardTitle: title });
            break;
          }

          case 'ADD_COMMENT': {
            const { cardId, comment } = event.payload;
            set((state) => {
              if (!state.cards[cardId]) return state;
              return {
                cards: {
                  ...state.cards,
                  [cardId]: {
                    ...state.cards[cardId],
                    comments: [...state.cards[cardId].comments, comment],
                  },
                },
              };
            });
            break;
          }

          case 'LOG_ACTION': {
            const { entry } = event.payload;
            set((state) => ({
              activityLog: [entry, ...state.activityLog].slice(0, 20),
            }));
            break;
          }

          case 'SET_TRANSIT': {
            set((state) => {
              const newSet = new Set(state.inTransitCardIds);
              if (event.payload.isTransit) newSet.add(event.payload.cardId);
              else newSet.delete(event.payload.cardId);
              return { inTransitCardIds: Array.from(newSet) };
            });
            break;
          }

          case 'SET_AUTO_SORT': {
            const { enabled } = event.payload;
            set((state) => {
              if (enabled) {
                const columns = state.columns.map(col => ({
                  ...col,
                  cardIds: sortCardIds(col.cardIds, state.cards)
                }));
                return { autoSortEnabled: enabled, columns };
              }
              return { autoSortEnabled: enabled };
            });
            break;
          }

          case 'SET_EDITING': {
            set((state) => {
              const newSet = new Set(state.editingCardIds);
              if (event.payload.isEditing) newSet.add(event.payload.cardId);
              else newSet.delete(event.payload.cardId);
              return { editingCardIds: Array.from(newSet) };
            });
            break;
          }
        }
      },
    }),
    {
      name: 'kanban-board',            // localStorage key
      storage: createJSONStorage(() => debouncedLocalStorage),
      // Only persist data, not functions
      partialize: (state) => ({
        boardTitle: state.boardTitle,
        columns: state.columns,
        cards: state.cards,
        activityLog: state.activityLog,
      }) as unknown as BoardStore,
    },
  ),
);

// ── Standalone Selectors (Safe from Persistence / Hydration Issues) ─────────────────

/** Select a card by its ID from the board store. */
export const selectCardById = (cardId: string) => (state: BoardStore) =>
  state.cards[cardId];

/** Select and map the ordered list of card objects inside a column. */
export const selectCardsByColumnId = (columnId: string) => (state: BoardStore) => {
  const column = state.columns.find((c) => c.id === columnId);
  if (!column) return [];
  return column.cardIds
    .map((id) => state.cards[id])
    .filter((card): card is Card => card !== undefined);
};

/** Select a column by its ID from the board store. */
export const selectColumnById = (columnId: string) => (state: BoardStore) =>
  state.columns.find((c) => c.id === columnId);
