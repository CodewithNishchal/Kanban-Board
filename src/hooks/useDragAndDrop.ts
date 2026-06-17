import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useBoardStore } from '../store/boardStore';
import { useState, useRef, useCallback } from 'react';

export function useDragAndDrop() {
  const moveCard = useBoardStore((s) => s.moveCard);
  const setTransitCard = useBoardStore((s) => s.setTransitCard);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RAF-based throttle: only allow one onDragOver per animation frame
  const rafRef = useRef<number | null>(null);

  // ── Helpers that always read LATEST store state ──────────────
  // Using useBoardStore.getState() instead of closure-captured selectors
  // so that handlers running after RAF-delayed updates always see
  // the freshest cards/columns — not stale render-cycle snapshots.

  const getCardById = (cardId: string) => {
    return useBoardStore.getState().cards[cardId] || null;
  };

  const findCardColumn = (cardId: string) => {
    return getCardById(cardId)?.columnId || null;
  };

  const calculateTarget = (overId: string) => {
    const { columns, cards } = useBoardStore.getState();

    // Case 1: overId is a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      return { toColumnId: overId, index: overColumn.cardIds.length };
    }

    // Case 2: overId is another card
    const overCard = cards[overId];
    if (overCard) {
      const toColumnId = overCard.columnId;
      const targetColumn = columns.find((c) => c.id === toColumnId);
      if (!targetColumn) return { toColumnId: null, index: 0 };
      const rawIndex = targetColumn.cardIds.indexOf(overId);
      // If card was displaced during intermediate moves, append at end
      const index = rawIndex >= 0 ? rawIndex : targetColumn.cardIds.length;
      return { toColumnId, index };
    }

    return { toColumnId: null, index: 0 };
  };

  // ── Handlers ─────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setTransitCard(event.active.id as string);
  };

  // The actual logic extracted so the RAF callback can invoke it
  const processDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveColumn(null);
      return;
    }

    const cardId = active.id as string;
    const overId = over.id as string;

    // Read fresh state each time — no stale closures
    const fromColumnId = findCardColumn(cardId);
    const { toColumnId, index } = calculateTarget(overId);

    // Guard: bail on invalid target column
    if (!toColumnId) return;

    if (!fromColumnId || fromColumnId === toColumnId) {
      setActiveColumn(toColumnId);
      return;
    }

    // Move to the new column immediately during drag (skip log)
    moveCard(cardId, toColumnId, index, true);
    setActiveColumn(toColumnId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveCard]);

  // Throttled handler: fires at most once per animation frame (~16ms at 60fps)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      processDragOver(event);
    });
  }, [processDragOver]);

  const handleDragEnd = (event: DragEndEvent) => {
    // Cancel any pending RAF from dragOver
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const droppedCardId = (event.active.id as string) || null;

    // Mark card as "dropping" — keeps the placeholder visible while
    // the DragOverlay plays its drop animation (250ms)
    setDroppingId(droppedCardId);
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    dropTimerRef.current = setTimeout(() => {
      setDroppingId(null);
      dropTimerRef.current = null;
    }, 280); // slightly > 250ms drop animation duration

    setActiveId(null);
    setActiveColumn(null);
    setTransitCard(null);

    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    // Read fresh state — not stale closure values
    const fromColumnId = findCardColumn(cardId);
    const { toColumnId, index } = calculateTarget(overId);

    // Guard: bail on invalid target column
    if (!toColumnId) return;

    if (fromColumnId && toColumnId) {
      // Final drop — log and broadcast
      moveCard(cardId, toColumnId, index);
    }
  };

  return { activeId, activeColumn, droppingId, handleDragStart, handleDragOver, handleDragEnd };
}
