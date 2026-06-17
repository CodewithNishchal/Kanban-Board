import React from 'react';
import { Home, User, Mail, Clock, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <div className="w-[100px] bg-[#120836] flex flex-col items-center py-8 h-full flex-shrink-0 z-20">
      {/* Logo */}
      <div className="mb-14 mt-2 flex justify-center">
        <div className="relative w-8 h-8">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-rose-400 to-violet-600"></div>
           <div className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600"></div>
           <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600"></div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col items-center space-y-8">
        <button className="w-12 h-12 bg-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.6)] text-white rounded-full flex items-center justify-center">
          <Home className="w-5 h-5" />
        </button>
        <button className="text-indigo-200/50 hover:text-white transition-colors">
          <User className="w-5 h-5" />
        </button>
        <button className="text-indigo-200/50 hover:text-white transition-colors">
          <Mail className="w-5 h-5" />
        </button>
        <button className="text-indigo-200/50 hover:text-white transition-colors">
          <Clock className="w-5 h-5" />
        </button>
        <button className="text-indigo-200/50 hover:text-white transition-colors">
          <FileText className="w-5 h-5" />
        </button>
        <button className="text-indigo-200/50 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto mb-4">
        <button className="text-indigo-200/50 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
