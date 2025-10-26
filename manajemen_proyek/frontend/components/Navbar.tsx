import { Bell, User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 fixed top-0 right-0 left-0 md:left-64 z-30">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex-1 min-w-0 mr-2">
          <h1 className="text-sm sm:text-base md:text-xl font-semibold text-gray-900 truncate">
            Cost Control Management System
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
            Construction Project Management
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={18} className="md:w-5 md:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Project Manager</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-white">
              <User size={18} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
