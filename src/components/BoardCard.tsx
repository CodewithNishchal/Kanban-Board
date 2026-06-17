import type React from 'react';
import { Paperclip, MessageCircle, MoreHorizontal, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../types';
import { useBoardStore } from '../store/boardStore';

const BoardCard: React.FC<{ card: Card; onEdit?: () => void; isEditing?: boolean; isOverlay?: boolean; droppingId?: string | null }> = ({ card, onEdit, isEditing, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const inTransitCardId = useBoardStore(state => state.inTransitCardId);
  const isTransit = inTransitCardId === card.id && !isDragging && !isOverlay;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0 : 1,
  };

  const getCategoryStyle = (category: string = '') => {
    const norm = category.toLowerCase().trim();
    if (norm.includes('web design')) return 'text-blue-600 bg-blue-50';
    if (norm.includes('app development')) return 'text-pink-600 bg-pink-50';
    if (norm.includes('mobile')) return 'text-orange-600 bg-orange-50';
    if (norm.includes('dashboard')) return 'text-violet-600 bg-violet-50';
    if (norm.includes('landing page')) return 'text-indigo-600 bg-indigo-50';
    if (norm.includes('web development')) return 'text-blue-600 bg-blue-50';
    return 'text-violet-600 bg-violet-50'; // default fallback
  };

  const progress = card.progress !== undefined ? card.progress : 0;
  const attachments = card.attachmentsCount !== undefined ? card.attachmentsCount : 6;
  const commentsCount = card.comments && card.comments.length > 0 ? card.comments.length : 4;

  const mockAvatars = [
    `https://i.pravatar.cc/150?u=user1_${card.id}`,
    `https://i.pravatar.cc/150?u=user2_${card.id}`,
    `https://i.pravatar.cc/150?u=user3_${card.id}`,
  ].slice(0, progress % 3 === 0 ? 3 : 2);

  const cardContent = isTransit ? (
    <div className="relative select-none opacity-80 flex flex-col h-full justify-between">
      {/* Dynamic Purple/Indigo radial glow */}
      <div 
        className="absolute -inset-5 pointer-events-none rounded-[1.25rem] transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
        }}
      />
      
      {/* Laser line scanning effect */}
      <motion.div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent shadow-[0_0_8px_rgba(139,92,246,0.6)] pointer-events-none z-10"
        animate={{
          top: ["0%", "100%", "0%"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="flex justify-between items-start mb-3">
        <span className="text-[11.5px] xl:text-[13px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100/50 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-ping" />
          {card.category || card.priority || 'Task'}
        </span>
        
        {/* Glowing Transit Signal Badge */}
        <span className="text-[11.5px] xl:text-[13px] font-black px-3 py-1 rounded-md uppercase tracking-widest bg-violet-500 text-white flex items-center gap-1.5 shadow-[0_0_10px_rgba(139,92,246,0.5)]">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          Transit
        </span>
      </div>
      
      <div className="my-2 relative">
        <h3 className="font-bold text-slate-500 text-[13px] xl:text-[15px] leading-relaxed pr-2 italic line-clamp-2">
          {card.title}
        </h3>
      </div>
      
      {/* Progress Bar Shimmer Scanner */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] xl:text-[13px] text-slate-500 mb-1 font-bold">
          <span>In Flight...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100/80 rounded-full h-1 relative overflow-hidden">
          <div 
            className="h-1 rounded-full bg-slate-200" 
            style={{ width: `${progress}%` }}
          />
          <motion.div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-violet-500 to-transparent w-16"
            animate={{
              left: ["-50%", "150%"]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </div>

      {/* Footer Grayed Stack */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-100/50">
        <div className="flex -space-x-1.5 opacity-50">
          {mockAvatars.map((url, i) => (
            <img 
              key={i} 
              src={url} 
              alt="Avatar" 
              className="w-5 h-5 rounded-full border border-white bg-gray-200 shadow-sm filter grayscale" 
            />
          ))}
        </div>
        
        <div className="flex space-x-3 text-slate-300">
          <div className="flex items-center space-x-1 text-[9.5px] xl:text-[11px] font-semibold">
            <Paperclip className="w-3 h-3" />
            <span>{attachments}</span>
          </div>
          <div className="flex items-center space-x-1 text-[9.5px] xl:text-[11px] font-semibold">
            <MessageCircle className="w-3 h-3" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10.5px] xl:text-[11.5px] font-extrabold px-3 py-1 rounded-full capitalize ${getCategoryStyle(card.category || card.priority)}`}>
          {card.category || card.priority}
        </span>
        <button className="text-gray-300 hover:text-gray-500 cursor-pointer p-0.5">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <h3 className="font-semibold text-slate-500 text-[13px] xl:text-[15px] mb-6 leading-relaxed pr-2">{card.title}</h3>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-end text-[11px] xl:text-[13px] text-gray-400 mb-1">
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1">
          <div 
            className="h-1 rounded-full bg-violet-600 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-50">
        <div className="flex -space-x-1.5">
          {mockAvatars.map((url, i) => (
            <img 
              key={i} 
              src={url} 
              alt="Avatar" 
              className="w-5 h-5 rounded-full border border-white bg-gray-200 shadow-sm" 
            />
          ))}
        </div>
        
        <div className="flex space-x-3 text-gray-400">
          <div className="flex items-center space-x-1 text-[11.5px] xl:text-[13px] font-semibold">
            <Paperclip className="w-3 h-3" />
            <span>{attachments}</span>
          </div>
          <div className="flex items-center space-x-1 text-[11.5px] xl:text-[13px] font-semibold">
            <MessageCircle className="w-3 h-3" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...(isTransit ? {} : listeners)} 
      className="mb-4 relative"
    >
      <div
        onClick={isTransit ? undefined : onEdit}
        className={
          isTransit
            ? "relative overflow-hidden bg-slate-50/50 backdrop-blur-[2px] p-5 rounded-[1.25rem] border border-violet-200/60 shadow-[0_0_12px_rgba(139,92,246,0.06)] select-none pointer-events-none transition-all duration-300 w-full aspect-[1.8] flex flex-col justify-between"
            : `bg-white p-5 rounded-[1.25rem] shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-300 border border-slate-100/80 w-full aspect-[1.8] flex flex-col justify-between ${isEditing ? 'scale-[1.03] ring-2 ring-violet-500 shadow-lg z-10' : 'hover:scale-[1.01]'}`
        }
      >
        {cardContent}
      </div>

      {/* Morphing Overlay for EditPanel transition (kept mounted during drag to avoid unmount glitches) */}
      {!isEditing && !isOverlay && (
        <motion.div
          layoutId={`card-${card.id}`}
          transition={{ duration: 0 }} // Prevent fighting with dnd-kit's CSS transform during sorting
          className={
            isTransit
              ? "absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] p-5 rounded-[1.25rem] border border-violet-200/60 pointer-events-none flex flex-col justify-between"
              : "absolute inset-0 bg-white p-5 rounded-[1.25rem] shadow-sm border border-slate-100/80 pointer-events-none flex flex-col justify-between"
          }
        >
          {cardContent}
        </motion.div>
      )}
    </div>
  );
};

export default BoardCard;
