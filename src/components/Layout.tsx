import type React from 'react';
import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Search } from 'lucide-react';
import Sidebar from './Sidebar';
import BoardColumn from './BoardColumn';
import BoardCard from './BoardCard';
import EditPanel from './EditPanel';
import { useBoardStore } from '../store/boardStore';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBroadcastSync, useActiveTabs } from '../sync/useBroadcastSync';
import { AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  useBroadcastSync();
  const activeTabs = useActiveTabs();
  const columns = useBoardStore(state => state.columns);
  const cards = useBoardStore(state => state.cards);
  const addCard = useBoardStore(state => state.addCard);
  const boardTitle = useBoardStore(state => state.boardTitle);
  const setBoardTitle = useBoardStore(state => state.setBoardTitle);
  const { activeId, droppingId, handleDragStart, handleDragOver, handleDragEnd } = useDragAndDrop();

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Migrating layout state & Seed mockup cards on load
  useEffect(() => {
    // 1. Rename/restructure columns to the requested 4-column layout
    const hasReview = columns.some(c => c.id === 'col-in-review');
    const needsRename = columns.some(c => 
      (c.id === 'col-todo' && c.title !== 'To Do') ||
      (c.id === 'col-in-progress' && c.title !== 'In Progress') ||
      (c.id === 'col-done' && c.title !== 'Done')
    );

    if (!hasReview || needsRename) {
      useBoardStore.setState((state) => {
        let updatedCols = state.columns.map(c => {
          if (c.id === 'col-todo') return { ...c, title: 'To Do' };
          if (c.id === 'col-in-progress') return { ...c, title: 'In Progress' };
          if (c.id === 'col-done') return { ...c, title: 'Done' };
          return c;
        });

        const hasReviewNow = updatedCols.some(c => c.id === 'col-in-review');
        if (!hasReviewNow) {
          // Re-insert col-in-review before col-done
          const doneIndex = updatedCols.findIndex(c => c.id === 'col-done');
          const newCol = { id: 'col-in-review', title: 'In Review', cardIds: [] };
          if (doneIndex !== -1) {
            updatedCols.splice(doneIndex, 0, newCol);
          } else {
            updatedCols.push(newCol);
          }
        } else {
          updatedCols = updatedCols.map(c => c.id === 'col-in-review' ? { ...c, title: 'In Review' } : c);
        }

        return { columns: updatedCols };
      });
    }

    // 1.5. Sanitization: Clean up duplicated cards across columns
    useBoardStore.setState((state) => {
      let modified = false;
      const seen = new Set<string>();
      const sanitizedCols = state.columns.map(col => {
        const uniqueIds = col.cardIds.filter(id => {
          if (seen.has(id)) {
            modified = true;
            return false;
          }
          seen.add(id);
          return true;
        });
        if (uniqueIds.length !== col.cardIds.length) modified = true;
        return { ...col, cardIds: uniqueIds };
      });
      return modified ? { columns: sanitizedCols } : state;
    });

    // 2. Seeding logic if the board has no cards (matches mockup cards style across 4 columns)
    const currentCards = useBoardStore.getState().cards;
    if (Object.keys(currentCards).length === 0) {
      // To Do Column
      addCard('col-todo', 'Wireframing, mockups, clients collaboration', 'medium', 'Web Design', 50, 6);
      addCard('col-todo', 'Wireframing, mockups, clients collaboration', 'high', 'App Development', 60, 6);
      addCard('col-todo', 'Wireframing, mockups, clients collaboration', 'low', 'Mobile App', 65, 6);
      
      // In Progress Column
      addCard('col-in-progress', 'Wireframing, mockups, clients collaboration', 'medium', 'Mobile App', 30, 6);
      addCard('col-in-progress', 'Wireframing, mockups, clients collaboration', 'low', 'Dashboard', 40, 6);
      
      // In Review Column
      addCard('col-in-review', 'Wireframing, mockups, clients collaboration', 'medium', 'Web Development', 50, 6);
      
      // Done Column
      addCard('col-done', 'Wireframing, mockups, clients collaboration', 'low', 'Dashboard', 90, 6);
      addCard('col-done', 'Wireframing, mockups, clients collaboration', 'high', 'Landing Page', 70, 6);
      addCard('col-done', 'Wireframing, mockups, clients collaboration', 'high', 'App Development', 80, 6);
    }
  }, [columns, addCard]);

  // Map the default store column IDs to their UI visual properties
  const columnConfigs = [
    { id: 'col-todo', title: 'To Do', bg: 'bg-slate-50/70', dot: '' },
    { id: 'col-in-progress', title: 'In Progress', bg: 'bg-slate-50/70', dot: '' },
    { id: 'col-in-review', title: 'In Review', bg: 'bg-slate-50/70', dot: '' },
    { id: 'col-done', title: 'Done', bg: 'bg-slate-50/70', dot: '' }
  ];

  const getCardsForColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return [];
    // Only return defined cards and filter them based on search and priority
    return column.cardIds
      .map(id => cards[id])
      .filter(card => card !== undefined)
      .filter(card => {
        if (priorityFilter !== 'All' && card.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
        if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
  };



  const activeCard = activeId ? cards[activeId] : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dropAnimationConfig: DropAnimation = {
    duration: 150,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div 
        className="flex h-screen overflow-hidden relative"
        style={{
          backgroundImage: 'url("/Design/Gemini_Generated_Image_slosenslosenslos.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden pt-6 pr-6 pl-4 pb-3 min-w-0 transition-all duration-[600ms]">
          <div 
            className="flex-1 flex flex-col rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-w-0 w-full"
            style={{
              backgroundImage: 'url("/Design/Gemini_Generated_Image_jav8d8jav8d8jav8.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Card Header */}
            <div className="px-10 pt-5 pb-6 flex justify-between items-center gap-4 flex-wrap">
              <input 
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                className="text-[36px] font-extrabold text-[#120836] tracking-tight bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-100 rounded-lg px-2 py-1 -ml-2 transition-all min-w-[150px] max-w-[40%] flex-shrink-0"
                style={{ width: `${Math.max(10, boardTitle.length)}ch` }}
              />
              
              <div className="flex-1 flex items-center justify-end gap-4">
                {/* Search */}
                <div className="relative w-full max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-full text-sm font-medium outline-none border border-slate-200 focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
                
                {/* Priority Filter */}
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 rounded-full text-sm font-medium text-gray-700 outline-none border border-slate-200 focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjNmI3MjgwIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE5IDlsLTcgNy03LTciPjwvcGF0aD48L3N2Zz4=')] bg-[length:16px_16px] bg-no-repeat bg-[right_10px_center]"
                >
                  <option value="All">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {/* Tab Sync Indicator */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm whitespace-nowrap">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-xs font-bold">{activeTabs} {activeTabs === 1 ? 'Tab' : 'Tabs'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 ml-2 flex-shrink-0">
                <button 
                  onClick={() => {
                    setIsLogsOpen(true);
                    setEditingCardId(null);
                  }}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-full shadow-md shadow-violet-500/10 transition-all cursor-pointer flex items-center whitespace-nowrap"
                >
                  Access Logs
                </button>
              </div>
            </div>
            
            {/* Board Area */}
            <div className="flex-1 overflow-x-auto px-6 pb-0 custom-scrollbar">
              <div className="flex space-x-4 items-stretch h-full min-w-full">
                {columnConfigs.map(col => (
                  <BoardColumn 
                    key={col.id}
                    id={col.id} 
                    title={col.title} 
                    bgColorClass={col.bg}
                    dotColorClass={col.dot}
                    cards={getCardsForColumn(col.id)}
                    onEditCard={(id) => {
                      setEditingCardId(id);
                      setIsLogsOpen(false);
                    }}
                    editingCardId={editingCardId}
                    droppingId={droppingId}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Smooth CSS Spacer to seamlessly push the board without jitter */}
        <div 
          className="transition-all duration-300 ease-in-out flex-shrink-0"
          style={{ width: (editingCardId || isLogsOpen) ? 436 : 0 }}
        />

        <AnimatePresence>
          {editingCardId && (
              <EditPanel key={`edit-${editingCardId}`} mode="edit" cardId={editingCardId} onClose={() => setEditingCardId(null)} />
          )}
          {isLogsOpen && (
            <div className="absolute right-0 top-0 bottom-0 flex z-40 shadow-2xl">
              <EditPanel key="logs-panel" mode="log" onClose={() => setIsLogsOpen(false)} />
            </div>
          )}
        </AnimatePresence>
      </div>

      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeCard ? <BoardCard card={activeCard} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Layout;
