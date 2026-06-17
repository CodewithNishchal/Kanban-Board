import type React from 'react';
import { Search, Filter } from 'lucide-react';

const Toolbar: React.FC = () => {


  return (
    <div className="flex justify-between items-center px-8 mb-6">
      <div className="flex items-center space-x-4">
        {/* Task Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search task"
            className="pl-9 pr-4 py-2 bg-white rounded-full text-sm outline-none shadow-sm w-48"
          />
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="bg-white border-none text-sm font-medium text-gray-700 py-2 px-3 rounded-full shadow-sm outline-none cursor-pointer">
            <option>Stage</option>
            <option>Priority</option>
            <option>Due Date</option>
          </select>
        </div>

        {/* Filter */}
        <button className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700 hover:text-primary">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
    </div>
    </div>
  );
};

export default Toolbar;
