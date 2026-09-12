import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Avatar from '../ui/Avatar';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, isManagerAdmin } = useAuth();
  const { info: toastInfo } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toastInfo('Logged out successfully.');
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  // Compute page title based on current pathname
  const getPageTitle = (pathname) => {
    if (pathname === '/profile') return 'My Profile & Account';
    if (pathname === '/reports') return 'My Weekly Reports';
    if (pathname === '/reports/new') return 'New Weekly Report';
    if (pathname.startsWith('/reports/')) return 'Report Details';
    if (pathname === '/dashboard') return 'Team Overview Dashboard';
    if (pathname === '/reviews') return 'Manager Review Inbox';
    if (pathname.startsWith('/reviews/')) return 'Review Report Submission';
    if (pathname === '/projects') return 'Project Directory';
    if (pathname === '/team') return 'Team Directory';
    return 'Workspace';
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Area: Mobile Menu + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right Area: User Status & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Role Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700/60 text-slate-300">
          {isManagerAdmin ? (
            <Shield className="w-3 h-3 text-purple-400" />
          ) : (
            <UserIcon className="w-3 h-3 text-teal-400" />
          )}
          <span className="font-mono text-[11px]">{user?.role}</span>
        </div>

        {/* User Profile Link */}
        <Link
          to="/profile"
          className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-800/80 transition-colors group"
          title="View profile & account settings"
        >
          <Avatar
            src={user?.avatar}
            name={user?.name}
            size="sm"
            ring={true}
          />
          <span className="hidden md:inline text-xs font-medium text-slate-200 group-hover:text-white">
            {user?.name}
          </span>
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          title="Sign out"
          aria-label="Sign out of account"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

