// ─────────────────────────────────────────────────────────────
// src/types/index.ts
// Canonical type definitions for the Kanban board.
// Every file in the project imports from here — nothing else
// should define its own data shapes.
// ─────────────────────────────────────────────────────────────

/** Card priority levels. Used for badge colours and filtering. */
export type Priority = 'low' | 'medium' | 'high';

/** Hardcoded assignee options for the board. */
export type Assignee = 'NV' | 'AB' | 'SK' | 'RP' | 'MJ' | '';

/** A comment on a card. */
export interface CardComment {
  id: string;
  text: string;
  tabId: string;
  timestamp: number;
}

/** A single Kanban card. */
export interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;   // ISO-8601 string or null
  columnId: string;          // ID of the column this card belongs to
  assignee: Assignee;        // Hardcoded initials — no real user system
  comments: CardComment[];   // Card-level comments shown in the edit panel
  createdAt: number;         // Unix-ms timestamp
}

/** A board column. Cards are referenced by ordered IDs, not embedded. */
export interface Column {
  id: string;
  title: string;
  cardIds: string[];         // Ordered list — drives render order
}

/** A single entry in the board-wide activity log. */
export interface ActivityEntry {
  id: string;
  tabId: string;
  timestamp: number;
  message: string;           // Human-readable: "Moved 'Bug fix' to Done"
}

/**
 * The persisted board state.
 * Cards live in a flat Record for O(1) lookups; columns hold ordered ID lists.
 */
export interface BoardState {
  columns: Column[];
  cards: Record<string, Card>;
  activityLog: ActivityEntry[];
}

// ── Discriminated union for sync messages ───────────────────
// Using a tagged union gives us exhaustive switch checks in
// applyRemoteAction and guarantees TypeScript strict mode catches
// any unhandled action types at compile time.

export type SyncAction =
  | { type: 'ADD_CARD';        payload: { columnId: string; card: Card } }
  | { type: 'EDIT_CARD';       payload: { cardId: string; updates: Partial<Card> } }
  | { type: 'DELETE_CARD';     payload: { cardId: string; columnId: string } }
  | { type: 'RENAME_COLUMN';   payload: { columnId: string; title: string } }
  | { type: 'MOVE_CARD';       payload: { cardId: string; fromColumnId: string; toColumnId: string; toIndex: number } }
  | { type: 'EDIT_BOARD_TITLE'; payload: { title: string } }
  | { type: 'ADD_COMMENT';     payload: { cardId: string; comment: CardComment } }
  | { type: 'LOG_ACTION';      payload: { entry: ActivityEntry } };

/** The envelope that travels over BroadcastChannel. */
export interface SyncMessage {
  tabId: string;
  event: SyncAction;
}
