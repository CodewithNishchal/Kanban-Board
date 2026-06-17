# Phase 3: Drag & Drop Integration

## 🎯 Objectives
* Install and integrate `@dnd-kit/core` and `@dnd-kit/sortable` libraries.
* Create a dedicated hook `src/hooks/useDragAndDrop.ts` to manage coordinates and visual feedback.
* Implement a visible drop indicator that dynamically shifts to show where the card will land.
* Bind drag completion directly to the Zustand store's `moveCard()` action.

---

## 💻 Technical Checklist

### 1. Installation
Install libraries:
`npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### 2. Setup DndContext and Sortable Contexts
* **`BoardView`**: Wraps the column grid in `<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>`.
* **`KanbanColumn`**: Wraps the cards list in `<SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>` and uses the `useDroppable` hook to define the column area as a drop zone.
* **`KanbanCard`**: Uses the `useSortable({ id: card.id })` hook to apply attributes, listeners, ref, and inline transform styles.

### 3. Drag Coordinates & Movement Logic
When a drag ends, the `onDragEnd` event delivers the `active` element (the card being dragged) and the `over` element (the card/column it was dropped on).

* **Case A: Reordering within the same column**:
  * If `active.id` and `over.id` belong to the same column, swap indices.
* **Case B: Moving to a different column**:
  * Detect target column using the card ID of the `over` element or matching column ID.
  * Splice the card ID out of the old column and insert it into the new column's card IDs list at the target index.

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const cardId = active.id as string;
  const overId = over.id as string;

  // Compute source column
  const fromColumnId = findCardColumn(cardId);
  // Compute target column and index
  const { toColumnId, index } = calculateTarget(overId, fromColumnId);

  if (fromColumnId && toColumnId) {
    moveCard(cardId, fromColumnId, toColumnId, index);
  }
};
```

### 4. Dynamic Drop Indicator (Gap Indicator)
* While a card is being dragged, `@dnd-kit`'s active item index is known. We will dynamically insert a spacer/placeholder component (`<div class="h-24 bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-xl my-2"></div>`) inside the column's child list matching the current `over` index, creating a visible "gap" preview before the drop is finalized.
