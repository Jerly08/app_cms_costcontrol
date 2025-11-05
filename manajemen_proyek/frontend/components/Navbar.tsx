import { Bell, User, Settings, Lock, LayoutDashboard, Database, Users, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import api from '@/lib/api';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={18} className="md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg transition-colors py-1 px-2"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'user@company.com'}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                <User size={18} className="md:w-5 md:h-5" />
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-600 transition-transform hidden md:block ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email || 'user@company.com'}</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/account-settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings size={16} className="text-gray-500" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    href="/change-password"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Lock size={16} className="text-gray-500" />
                    <span>Change Password</span>
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <LayoutDashboard size={16} className="text-gray-500" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/technical-data"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Database size={16} className="text-gray-500" />
                    <span>Technical Data</span>
                  </Link>
                  <Link
                    href="/user-management"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Users size={16} className="text-gray-500" />
                    <span>User Management</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
