import React from 'react';
import {
  Home,
  Calendar,
  Folder,
  Users,
  FileText,
  Headphones
} from 'lucide-react';
import { useBoardStore } from '../store/boardStore';

const Sidebar: React.FC = () => {
  return (
    <div className="group w-[80px] hover:w-[260px] bg-[#120836] border-r border-indigo-900/30 flex flex-col items-stretch py-6 h-full flex-shrink-0 z-20 transition-all duration-[600ms] delay-0 hover:delay-[600ms] overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Logo */}
      <div className="mb-12 mt-4 flex items-center whitespace-nowrap pl-[24px] group-hover:pl-[34px] transition-all duration-[600ms] delay-0 group-hover:delay-[600ms]">
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-rose-400 to-violet-600"></div>
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600"></div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600"></div>
        </div>
        <span className="ml-5 font-bold text-xl text-white opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms]">
          Taskfly
        </span>
      </div>

      <div className="flex-1 overflow-hidden group-hover:overflow-y-scroll overflow-x-hidden flex flex-col">

        {/* Spacer above Main Section to center it vertically */}
        <div className="flex-grow transition-all duration-[600ms]"></div>

        {/* Main Section */}
        <div className="mb-2 group-hover:mb-8 transition-all duration-[600ms] delay-0 group-hover:delay-[600ms]">
          <div className="max-h-0 group-hover:max-h-[40px] opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-[600ms] delay-0 group-hover:delay-[600ms]">
            <p className="pl-[34px] mb-2 text-xs font-bold text-indigo-400/80 tracking-wider">MAIN</p>
          </div>
          <nav className="flex flex-col space-y-0.5">
            <NavItem icon={<Home className="w-5 h-5" />} label="Dashboard" active />
            <NavItem icon={<Calendar className="w-5 h-5" />} label="Calendar" />
            <NavItem icon={<Folder className="w-5 h-5" />} label="Projects" />
            <NavItem icon={<Users className="w-5 h-5" />} label="Teams" />
            <NavItem icon={<FileText className="w-5 h-5" />} label="Documents" />
          </nav>
        </div>

        {/* Spacer below Main Section to center it vertically */}
        <div className="flex-grow transition-all duration-[600ms]"></div>

        {/* Labels Section */}
        <div className="max-h-0 group-hover:max-h-[500px] mb-0 group-hover:mb-8 opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-[600ms] delay-0 group-hover:delay-[600ms]">
          <p className="pl-[34px] mb-2 text-xs font-bold text-indigo-400/80 tracking-wider">LABELS</p>
          <nav className="flex flex-col space-y-1">
            <LabelItem color="bg-red-500" label="High Priority" shortcut="⌘ 1" />
            <LabelItem color="bg-indigo-400" label="Medium Priority" shortcut="⌘ 2" />
            <LabelItem color="bg-amber-500" label="Low Priority" shortcut="⌘ 3" />
            <LabelItem color="bg-emerald-500" label="On Standby" shortcut="⌘ 4" />
          </nav>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto mb-4 border-t border-indigo-900/50 pt-4">
        <div className="px-[16px] group-hover:px-[26px] mb-2 transition-all duration-[600ms] delay-0 group-hover:delay-[600ms]">
          <button
            onClick={() => {
              const { autoSortEnabled, setAutoSortEnabled } = useBoardStore.getState();
              setAutoSortEnabled(!autoSortEnabled);
            }}
            className="w-full flex items-center py-2 px-3 rounded-2xl hover:bg-white/5 transition-all group/toggle"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className={`w-8 h-4 rounded-full transition-colors ${useBoardStore(state => state.autoSortEnabled) ? 'bg-violet-600' : 'bg-indigo-900/50'}`}></div>
              <div className={`absolute top-2 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${useBoardStore(state => state.autoSortEnabled) ? 'right-2 translate-x-[2px] -translate-y-[2px]' : 'left-2 -translate-x-[2px] -translate-y-[2px]'}`}></div>
            </div>
            <span className="ml-4 text-sm font-semibold text-indigo-200/70 group-hover/toggle:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms] whitespace-nowrap">Auto Sort</span>
          </button>
        </div>
        <nav className="flex flex-col space-y-0.5">
          <NavItem icon={<Headphones className="w-5 h-5" />} label="Support" />
        </nav>
      </div>


      {/* User Profile */}
      <div className="flex items-center whitespace-nowrap mt-2 mb-4 pl-[20px] group-hover:pl-[30px] transition-all duration-[600ms] delay-0 group-hover:delay-[600ms]">
        <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-900/40 rounded-full border-2 border-[#120836] shadow-sm">
          <Users className="w-5 h-5 text-indigo-300" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#120836] rounded-full"></div>
        </div>
        <div className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms]">
          <p className="text-sm font-bold text-white flex items-center">
            Guest User
          </p>
          <p className="text-[11px] text-indigo-300/70">guest@kanban.local</p>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => {
  return (
    <button className={`flex items-center py-0.5 pl-[16px] group-hover:pl-[26px] pr-4 rounded-full transition-all duration-[600ms] delay-0 group-hover:delay-[600ms] whitespace-nowrap overflow-hidden w-full group/btn hover:bg-white/5`}>
      <span className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${active ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.6)]' : 'text-indigo-200/50 group-hover/btn:text-white transition-colors'}`}>
        {icon}
      </span>
      <span className={`ml-4 text-sm font-semibold ${active ? 'text-white' : 'text-indigo-200/70 group-hover/btn:text-white'} opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms]`}>{label}</span>
      {active && (
        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms]">
          <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </span>
      )}
    </button>
  );
};

const LabelItem = ({ color, label, shortcut }: { color: string, label: string, shortcut: string }) => {
  return (
    <button className="flex items-center justify-between py-1.5 pl-[16px] group-hover:pl-[26px] pr-4 rounded-full hover:bg-white/5 transition-all duration-[600ms] delay-0 group-hover:delay-[600ms] whitespace-nowrap overflow-hidden w-full group/label">
      <div className="flex items-center">
        <span className="flex-shrink-0 flex items-center justify-center w-12 h-12">
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
        </span>
        <span className="ml-4 text-sm font-semibold text-indigo-200/70 group-hover/label:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms]">{label}</span>
      </div>
      <span className="text-[10px] font-bold text-indigo-300/50 border border-white/10 bg-white/5 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-0 group-hover:delay-[600ms]">{shortcut}</span>
    </button>
  );
};

export default Sidebar;
