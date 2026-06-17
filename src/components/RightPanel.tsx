import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit2, Activity, MoreHorizontal, MessageCircle } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import type { Priority } from '../types';
import { useRelativeTimeRefresh } from '../hooks/useRelativeTimeRefresh';
import { getRelativeTime } from '../utils/time';

interface RightPanelProps {
  cardId: string | null;
  onClose: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ cardId, onClose }) => {
  const cards = useBoardStore(state => state.cards);
  const editCard = useBoardStore(state => state.editCard);
  const deleteCard = useBoardStore(state => state.deleteCard);
  const activityLog = useBoardStore(state => state.activityLog);
  const addComment = useBoardStore(state => state.addComment);
  
  const [activeTab, setActiveTab] = useState<'edit' | 'activity'>('edit');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [commentText, setCommentText] = useState('');
  
  const card = cardId ? cards[cardId] : null;
  const prevCardId = useRef<string | null>(null);

  // Refs for current input values to use in unmount/cleanup without triggering it
  const titleRef = useRef(title);
  const descRef = useRef(description);
  const cardRef = useRef(card);

  useEffect(() => {
    titleRef.current = title;
    descRef.current = description;
    cardRef.current = card;
  }, [title, description, card]);

  // Sync state when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setPriority(card.priority);
      setIsConfirmingDelete(false);
      
      // Auto switch to edit if it's a new card being selected
      if (prevCardId.current !== card.id) {
        setActiveTab('edit');
      }
      prevCardId.current = card.id;
    }
  }, [card?.id]); // Only run when the selected card ID changes, not on every store update!

  // Flush edits to store
  const handleSave = () => {
    const currentCard = cardRef.current;
    if (!currentCard) return;
    
    const t = titleRef.current.trim();
    const d = descRef.current.trim();
    
    if (t && t !== currentCard.title) {
      editCard(currentCard.id, { title: t });
    }
    if (d !== (currentCard.description || '')) {
      editCard(currentCard.id, { description: d });
    }
  };

  useEffect(() => {
    // Flush on unmount or when switching cards
    return () => handleSave();
  }, [cardId]);

  // Tab switch handler
  const handleTabSwitch = (tab: 'edit' | 'activity') => {
    if (tab === 'activity') {
      handleSave(); // Flush before switching away
    }
    setActiveTab(tab);
  };

  useRelativeTimeRefresh(); // Refresh component every 30s to update relative times

  const handleDelete = () => {
    if (cardId) {
      deleteCard(cardId);
      onClose();
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId || !commentText.trim()) return;
    addComment(cardId, commentText.trim());
    setCommentText('');
  };

  if (!card) {
    return (
      <div className="w-[380px] bg-slate-50 border-l border-slate-200 flex flex-col p-6 h-full flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#120836]">Dashboard</h2>
        </div>
        
        {/* Mock Stats View */}
        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm mb-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Selected Team</h3>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <img src="https://i.pravatar.cc/150?u=1" className="w-10 h-10 rounded-full border-2 border-white" alt="Avatar"/>
              <img src="https://i.pravatar.cc/150?u=2" className="w-10 h-10 rounded-full border-2 border-white" alt="Avatar"/>
              <img src="https://i.pravatar.cc/150?u=3" className="w-10 h-10 rounded-full border-2 border-white" alt="Avatar"/>
            </div>
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">
              <MoreHorizontal className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <div className="bg-[#120836] text-white rounded-[1.5rem] p-6 shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-slate-300 mb-1">Total Progress</h3>
            <div className="text-4xl font-bold mb-4">72%</div>
            {/* Mock Donut Chart */}
            <div className="w-24 h-24 rounded-full border-4 border-violet-500 border-t-transparent ml-auto"></div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-violet-600 rounded-full opacity-20 blur-xl"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
            <div className="text-2xl font-bold text-[#120836] mb-1">12</div>
            <div className="text-xs font-medium text-slate-500">Completed</div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
            <div className="text-2xl font-bold text-[#120836] mb-1">4</div>
            <div className="text-xs font-medium text-slate-500">In Progress</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-slate-50 border-l border-slate-200 flex flex-col h-full flex-shrink-0 z-50 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-full w-full max-w-[200px]">
            <button 
              onClick={() => handleTabSwitch('edit')}
              className={`flex-1 flex items-center justify-center space-x-2 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'edit' ? 'bg-white text-[#120836] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button 
              onClick={() => handleTabSwitch('activity')}
              className={`flex-1 flex items-center justify-center space-x-2 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'activity' ? 'bg-white text-[#120836] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity</span>
            </button>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors bg-white shadow-sm border border-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'edit' && (
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 custom-scrollbar">
          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#120836] mb-2">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#120836] mb-2">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                placeholder="Add a detailed description..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#120836] mb-2">Priority</label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { setPriority(p); editCard(card.id, { priority: p }); }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                      priority === p 
                        ? p === 'high' ? 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' 
                          : p === 'medium' ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm' 
                          : 'bg-cyan-100 text-cyan-700 border-cyan-200 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
             <label className="block text-xs font-bold text-[#120836] mb-4">Comments</label>
             <div className="space-y-4 mb-4 max-h-[150px] overflow-y-auto custom-scrollbar">
                {card.comments?.map(comment => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0"></div>
                    <div>
                      <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 border border-slate-100">{comment.text}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{getRelativeTime(comment.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {(!card.comments || card.comments.length === 0) && (
                   <p className="text-xs text-slate-400 text-center py-2">No comments yet</p>
                )}
             </div>
             <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..." 
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button type="submit" disabled={!commentText.trim()} className="p-2 bg-[#120836] text-white rounded-xl disabled:opacity-50 hover:bg-violet-900 transition-colors">
                  <MessageCircle className="w-4 h-4"/>
                </button>
             </form>
          </div>

          <div className="mt-auto">
            {isConfirmingDelete ? (
              <div className="bg-rose-50 p-4 rounded-[1.5rem] border border-rose-100 shadow-sm">
                <p className="text-xs text-rose-800 font-bold mb-3 text-center">Delete this task permanently?</p>
                <div className="flex space-x-2">
                  <button onClick={handleDelete} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
                    Yes, Delete
                  </button>
                  <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full flex items-center justify-center space-x-2 py-3 text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent rounded-[1.5rem] text-sm font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
           <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-xs font-bold text-[#120836]">Recent Activity</h3>
             </div>
             <div className="p-4 space-y-5 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {activityLog.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-4">No activity yet.</div>
                ) : (
                  activityLog.map((log) => (
                    <div key={log.id} className="relative flex items-start space-x-4">
                      <div className="w-3 h-3 bg-[#120836] rounded-full border-2 border-white flex-shrink-0 mt-1 relative z-10 shadow-sm"></div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">{log.message}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-slate-400">{getRelativeTime(log.timestamp)}</span>
                          {log.tabId !== 'local' && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-semibold">Tab {log.tabId.slice(0,4)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
