import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useBoardStore } from '../store/boardStore';
import { useState } from 'react';

export function useDragAndDrop() {
  const moveCard = useBoardStore((s) => s.moveCard);
  const getCardById = useBoardStore((s) => s.getCardById);
  const columns = useBoardStore((s) => s.columns);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const findCardColumn = (cardId: string) => {
    return getCardById(cardId)?.columnId || null;
  };

  const calculateTarget = (overId: string) => {
    // Case 1: overId is a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
       return { toColumnId: overId, index: overColumn.cardIds.length };
    }
    
    // Case 2: overId is another card
    const overCard = getCardById(overId);
    if (overCard) {
       const toColumnId = overCard.columnId;
       const targetColumn = columns.find(c => c.id === toColumnId);
       const index = targetColumn?.cardIds.indexOf(overId) ?? 0;
       return { toColumnId, index };
    }

    return { toColumnId: null, index: -1 };
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setActiveColumn(null);
      return;
    }
    const { toColumnId } = calculateTarget(over.id as string);
    setActiveColumn(toColumnId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    if (cardId === overId) return;

    const fromColumnId = findCardColumn(cardId);
    const { toColumnId, index } = calculateTarget(overId);

    if (fromColumnId && toColumnId) {
      moveCard(cardId, fromColumnId, toColumnId, index);
    }
  };

  return { activeId, activeColumn, handleDragStart, handleDragOver, handleDragEnd };
}
