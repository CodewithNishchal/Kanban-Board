import type React from 'react';
import { useState, useEffect } from 'react';
import { X, Trash2, Send, Calendar, User, Edit2, Check, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore } from '../store/boardStore';
import { getRelativeTime } from '../utils/time';
import { useRelativeTimeRefresh } from '../hooks/useRelativeTimeRefresh';
import type { Priority, Assignee, Card } from '../types';


interface EditPanelProps {
  mode?: 'edit' | 'log';
  cardId?: string;
  originRect?: DOMRect | null;
  onClose: () => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ mode = 'edit', cardId, originRect, onClose }) => {
  const cards = useBoardStore(state => state.cards);
  const activityLog = useBoardStore(state => state.activityLog);
  const editCard = useBoardStore(state => state.editCard);
  const deleteCard = useBoardStore(state => state.deleteCard);
  const addComment = useBoardStore(state => state.addComment);

  useRelativeTimeRefresh(30000);

  const card = (mode === 'edit' && cardId) ? cards[cardId] : undefined;
  const columnTitle = useBoardStore(state => state.columns.find(c => c.id === card?.columnId)?.title || 'Column');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [assignee, setAssignee] = useState<Assignee>('');
  const [newComment, setNewComment] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Initialize local state once when the panel opens for a specific card
  useEffect(() => {
    if (mode === 'edit' && card) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(card.title);
      setDescription(card.description || '');
      setPriority(card.priority);
      setDueDate(card.dueDate || '');
      setAssignee(card.assignee || '');
      setIsConfirmingDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingComments) {
          setIsEditingComments(false);
          setEditingCommentId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [onClose, isEditingComments]);

  // Auto-save effect: syncs local state to the global store after 100ms of no typing
  useEffect(() => {
    if (mode !== 'edit' || !card || !cardId) return;
    const timer = setTimeout(() => {
      const updates: Partial<Omit<Card, 'id'>> = {};
      let hasChanges = false;

      if (title.trim() && title !== card.title) {
        updates.title = title;
        hasChanges = true;
      }
      if (description !== (card.description || '')) {
        updates.description = description;
        hasChanges = true;
      }
      if (dueDate !== (card.dueDate || '')) {
        updates.dueDate = dueDate;
        hasChanges = true;
      }

      if (hasChanges) {
        editCard(cardId, updates);
      }
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, dueDate]);

  if (mode === 'edit' && !card) return null;

  const handleDelete = () => {
    if (cardId) {
      onClose();
      deleteCard(cardId);
    }
  };

  const handleAddComment = () => {
    if (cardId && newComment.trim()) {
      addComment(cardId, newComment.trim());
      setNewComment('');
    }
  };

  const handleSaveCommentEdit = (commentId: string) => {
    if (!cardId || !card || !editingCommentText.trim()) return;
    const newComments = card.comments.map(c =>
      c.id === commentId ? { ...c, text: editingCommentText.trim() } : c
    );
    editCard(cardId, { comments: newComments });
    setEditingCommentId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!cardId || !card) return;
    const newComments = card.comments.filter(c => c.id !== commentId);
    editCard(cardId, { comments: newComments });
  };

  if (mode === 'log') {
    return (
      <motion.div
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative flex-shrink-0 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-slate-100 flex flex-col z-50 overflow-hidden"
      >
        <div className="w-[420px] flex flex-col h-full bg-slate-50">
          <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center space-x-2 text-[19px] font-bold text-slate-500">
              <Activity className="w-5 h-5 text-violet-500" />
              <span className="font-extrabold text-[#120836]">Activity Log</span>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-gray-500 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {activityLog.length === 0 ? (
              <p className="text-gray-400 italic text-center py-4 text-sm font-medium">No activity yet.</p>
            ) : (
              activityLog.map(entry => (
                <div key={entry.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-[15px] text-gray-700 font-bold mb-3 leading-relaxed">{entry.message}</p>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-400">{getRelativeTime(entry.timestamp)}</span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      TAB {entry.tabId.slice(-4).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const originY = originRect ? originRect.top + (originRect.height / 2) - 24 : '50%';

  return (
    <motion.div
      initial={{ x: 40, scale: 0.95, opacity: 0 }}
      animate={{ x: 0, scale: 1, opacity: 1 }}
      exit={{ x: 40, scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      style={{ transformOrigin: `-50% ${originY}px` }}
      className="absolute right-6 top-6 bottom-6 z-50 bg-white shadow-2xl rounded-[2rem] border border-slate-100 flex flex-col overflow-hidden"
    >
      <div className="w-[420px] flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-2 text-[19px] font-bold text-slate-500 flex-wrap">
            <span className="font-extrabold">{columnTitle}</span>
            <span className="text-slate-400">→</span>
            <span className="text-[#120836] font-black truncate max-w-[240px]">{card?.title}</span>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-gray-500 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-3.5 px-6 pb-6 space-y-5 custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none custom-scrollbar"
              placeholder="Add a more detailed description..."
            />
          </div>

          {/* Priority & Due Date (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
              <div className="flex flex-col space-y-2">
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { if (cardId) { setPriority(p); editCard(cardId, { priority: p }); } }}
                    className={`py-2.5 px-3 rounded-lg text-sm font-bold capitalize border transition-colors ${priority === p
                      ? p === 'high' ? 'bg-rose-100 text-rose-600 border-rose-200 shadow-sm'
                        : p === 'medium' ? 'bg-amber-100 text-amber-600 border-amber-200 shadow-sm'
                          : 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm'
                      : 'bg-white text-gray-500 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-5">
              <div>
                <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-[15px] h-[15px]" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[15px] font-medium text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-[15px] h-[15px]" /> Assignee
                </label>
                <select
                  value={assignee}
                  onChange={(e) => {
                    const val = e.target.value as Assignee;
                    setAssignee(val);
                    if (cardId) editCard(cardId, { assignee: val });
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[15px] font-medium text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  <option value="NV">NV</option>
                  <option value="AB">AB</option>
                  <option value="SK">SK</option>
                  <option value="RP">RP</option>
                  <option value="MJ">MJ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-5 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">Activity & Comments</label>
              <button
                onClick={() => {
                  setIsEditingComments(!isEditingComments);
                  if (isEditingComments) {
                    setEditingCommentId(null);
                  }
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title={isEditingComments ? "Save Edits" : "Edit Comments"}
              >
                {isEditingComments ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-extrabold uppercase tracking-wider text-[10px]">Save Edits</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    <span className="font-extrabold uppercase tracking-wider text-[10px]">Edit</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
              {card?.comments && card.comments.length > 0 ? (
                card.comments.map(comment => (
                  <div key={comment.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-gray-700">User</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isEditingComments && (
                          <div className="flex items-center space-x-1.5 ml-2 border-l border-slate-200 pl-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.text);
                              }}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Edit Comment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-0.5 hover:bg-red-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.stopPropagation();
                            setEditingCommentId(null);
                          } else if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveCommentEdit(comment.id);
                          }
                        }}
                        autoFocus
                        className="w-full mt-1 px-3 py-2 bg-white border border-violet-300 rounded-lg text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-base text-gray-600 leading-relaxed">{comment.text}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-base text-gray-400 italic text-center py-2">No comments yet.</p>
              )}
            </div>

            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Write a comment..."
                rows={2}
                className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none custom-scrollbar"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 pt-3 mt-auto border-t border-slate-100 bg-slate-50/50 flex-shrink-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {isConfirmingDelete ? (
              <motion.div
                key="confirm-delete"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm"
              >
                <p className="text-sm text-red-800 font-bold mb-3 text-center">Delete this task?</p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 py-2 bg-white hover:bg-slate-50 text-gray-700 border border-slate-200 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="delete-btn"
                onClick={() => setIsConfirmingDelete(true)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default EditPanel;
