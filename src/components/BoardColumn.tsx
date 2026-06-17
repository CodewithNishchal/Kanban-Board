import type React from 'react';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import BoardCard from './BoardCard';
import { useBoardStore } from '../store/boardStore';
import type { Card } from '../types';

interface ColumnProps {
  id: string;
  title: string;
  count?: number;
  bgColorClass: string;
  dotColorClass: string;
  cards: Card[];
  onEditCard?: (id: string) => void;
  editingCardId?: string | null;
  droppingId?: string | null;
}

const BoardColumn: React.FC<ColumnProps> = ({ id, title, bgColorClass, cards = [], onEditCard, editingCardId, droppingId }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const addCard = useBoardStore(state => state.addCard);
  const renameColumn = useBoardStore(state => state.renameColumn);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState(title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  useEffect(() => {
    setEditTitleVal(title);
  }, [title]);

  const handleAddNewTask = () => {
    setIsAddingCard(true);
  };

  const handleCreateCard = () => {
    if (newCardTitle.trim()) {
      addCard(id, newCardTitle.trim(), 'low');
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateCard();
    } else if (e.key === 'Escape') {
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleSaveTitle = () => {
    if (editTitleVal.trim() && editTitleVal.trim() !== title) {
      renameColumn(id, editTitleVal.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitleVal(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      id={id} 
      className={`flex-1 basis-80 min-w-[350px] flex flex-col p-4 rounded-2xl transition-all ${bgColorClass} ${isOver ? 'ring-2 ring-violet-500/20 shadow-inner' : ''}`}
      style={{ minHeight: 'calc(100vh - 250px)' }}
    >
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center min-w-0 flex-1 mr-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitleVal}
              onChange={(e) => setEditTitleVal(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="font-extrabold text-[#120836] text-[22px] xl:text-[26px] tracking-tight border-b border-violet-500 outline-none w-full bg-transparent px-0.5 py-0"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <h2 
              onDoubleClick={() => setIsEditingTitle(true)}
              className="font-extrabold text-[#120836] text-[22px] xl:text-[26px] tracking-tight truncate cursor-pointer select-none hover:text-violet-600 transition-colors flex-shrink-0"
              title="Double click to rename"
            >
              {title}
            </h2>
          )}
          <span className="text-[10.5px] xl:text-[11.5px] text-white font-extrabold bg-emerald-500 px-2.5 py-1 rounded-full shadow-xs flex-shrink-0 ml-3 inline-flex items-center justify-center">
            Count: {cards.length}
          </span>
        </div>
        <button 
          onClick={handleAddNewTask} 
          className="text-gray-500 bg-white hover:bg-slate-50 hover:text-gray-800 transition-all p-1.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-center cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <BoardCard key={card.id} card={card} onEdit={() => onEditCard?.(card.id)} isEditing={editingCardId === card.id} droppingId={droppingId} />
          ))}
        </SortableContext>
      </div>

      <div className="mt-4 flex flex-col flex-shrink-0">
        <AnimatePresence initial={false}>
          {isAddingCard ? (
            <motion.div
              key="inline-add-card"
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-100/80 mb-2"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full capitalize text-violet-600 bg-violet-50">
                  low priority
                </span>
              </div>
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => {
                  if (!newCardTitle.trim()) {
                    setIsAddingCard(false);
                  }
                }}
                placeholder="Name your task..."
                className="w-full p-1 font-semibold text-slate-700 text-sm leading-relaxed outline-none border-b-2 border-transparent focus:border-violet-500 transition-all bg-transparent"
                autoFocus
              />
              <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-50">
                <span className="text-[10px] text-gray-400 font-medium">Enter to save, Esc to cancel</span>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => {
                      setNewCardTitle('');
                      setIsAddingCard(false);
                    }}
                    className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateCard}
                    className="px-3 py-1 bg-violet-600 text-white rounded-full text-xs font-bold shadow-xs hover:bg-violet-700 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-card-button"
              onClick={() => setIsAddingCard(true)}
              className="w-full py-3 bg-white/40 hover:bg-white border border-dashed border-slate-200 hover:border-violet-300 rounded-[1.25rem] text-[#120836]/60 hover:text-violet-600 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-xs cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Plus className="w-4 h-4 text-violet-500" />
              Add Card
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BoardColumn;
