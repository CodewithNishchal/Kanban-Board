# Phase 3 Modifications

## Implemented Features

1. **Installed Dependencies**:
   - Integrated `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` via `npm install`.

2. **`useDragAndDrop` Hook**:
   - Created `src/hooks/useDragAndDrop.ts` to manage coordinates and visual feedback.
   - Bound the drag completion directly to the Zustand store's `moveCard()` action.
   - Implemented `calculateTarget` to correctly resolve the target column and target index whether the drop happens over another card or over an empty column space.
   - Exposes `activeId` state to be used later for rendering the visible drop indicator gap.
   - Implemented `handleDragOver` to track the `activeColumn` state in real-time, providing immediate visual feedback during cross-column drags before the drop finalizes.
   - Exposes `activeColumn`, `handleDragStart`, `handleDragOver`, and `handleDragEnd` for direct integration into `DndContext`.

*Note: Since Phase 1 UI component files (`BoardView`, `KanbanColumn`, `KanbanCard`) have not been fully scaffolded yet, the hook has been developed as an independent logic block ready for integration. Wrapping the components with `DndContext` and `SortableContext` will take place as those files are built out.*
