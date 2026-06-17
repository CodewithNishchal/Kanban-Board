import React from 'react';
import { Search, Bell, Calendar, ChevronDown, Menu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="w-full bg-transparent flex justify-between items-center py-2 px-2 mb-2">
      {/* Left section: Hamburger and Search */}
      <div className="flex items-center space-x-6 w-full max-w-md">
        <button className="text-gray-600 hover:text-gray-900 transition-colors p-1 cursor-pointer">
          <Menu className="w-6 h-6" />
        </button>
        {/* Global Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-11 pr-4 py-3 bg-white rounded-full text-sm font-medium outline-none shadow-sm border border-slate-100 focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4 flex-shrink-0">

        <button className="w-10 h-10 bg-transparent flex items-center justify-center text-gray-400 hover:text-[#120836] transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 bg-transparent flex items-center justify-center text-gray-400 hover:text-[#120836] transition-colors">
          <Calendar className="w-5 h-5" />
        </button>
        
        {/* Vertical separator */}
        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
        
        <div className="flex items-center space-x-3 bg-white rounded-full pr-4 pl-1 py-1 cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100/80 shadow-sm">
          <img src="https://i.pravatar.cc/150?u=sullivan" alt="User" className="w-8 h-8 rounded-full border border-slate-200" />
          <span className="text-sm font-bold text-[#120836]">Sullivan</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default Header;
