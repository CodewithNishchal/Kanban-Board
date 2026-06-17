# Phase 1: Project Scaffolding & Tailwind UI Layout

## 🎯 Objectives
* Initialize Tailwind CSS and setup global styling.
* Define strict TypeScript interfaces for all board structures in `src/types/index.ts`.
* Build the static responsive board shell (header, columns, cards, inline drawer, and activity sidebar) with modern premium aesthetics (vibrant dark mode, frosted glass elements, and smooth transition properties).

---

## 💻 Technical Checklist

### 1. Tailwind & Basic Configuration
Verify/Install Tailwind CSS and set up a custom theme with HSL colors for status badges and dark mode.
We will customize variables in `src/index.css` for a high-end dashboard feel.

### 2. TypeScript Types (`src/types/index.ts`)
Define the type contract. We will use a discriminated union for `SyncMessage` to ensure strict compile-time checks for sync actions.

```typescript
export type Priority = 'low' | 'medium' | 'high';

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null; // ISO string format or null
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[]; // Ordered list of Card IDs
}

export interface ActivityEntry {
  id: string;
  tabId: string;
  timestamp: number;
  message: string;
}

export interface BoardState {
  columns: Column[];
  cards: Record<string, Card>;
  activityLog: ActivityEntry[];
}

export type SyncAction =
  | { type: 'ADD_CARD'; payload: { columnId: string; card: Card } }
  | { type: 'EDIT_CARD'; payload: { cardId: string; updates: Partial<Card> } }
  | { type: 'DELETE_CARD'; payload: { cardId: string } }
  | { type: 'RENAME_COLUMN'; payload: { columnId: string; title: string } }
  | { type: 'MOVE_CARD'; payload: { cardId: string; fromColumnId: string; toColumnId: string; toIndex: number } }
  | { type: 'LOG_ACTION'; payload: { entry: ActivityEntry } };

export interface SyncMessage {
  tabId: string;
  event: SyncAction;
}
```

### 3. Layout Grid Setup
* **`App.tsx` / `page.tsx`**: Host the master container with flex layout.
* **Top Header Bar**: 
  * Left: Editable Board Title.
  * Center: Search Bar & Priority toggle pills (All, High, Medium, Low).
  * Right: Live Tab Counter (`● 3 Tabs Connected`) & Toggle button for Activity Log.
* **Board Grid**: Flex row wrapping the 4 default columns.
* **Inline Edit Drawer**: A persistent `<aside>` panel that slides out from the right when a card is selected. Width: `380px`.
* **Activity Log Sidebar**: A collapsible drawer matching the drawer styling on the left/right.

---

## 🎨 Premium Visual Specs (Tailwind Classes)
* **Theme**: Deep futuristic gray/slate background: `bg-slate-950 text-slate-100`.
* ** frosted Columns**: `bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl`.
* **Cards**: `bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:shadow-violet-950/20 shadow-md transition-all duration-300 ease-out cursor-grab active:cursor-grabbing`.
* **Badges**:
  * High: `bg-rose-500/10 text-rose-400 border border-rose-500/20`
  * Medium: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
  * Low: `bg-sky-500/10 text-sky-400 border border-sky-500/20`
