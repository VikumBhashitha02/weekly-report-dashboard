import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  LayoutDashboard,
  Inbox,
  FolderGit2,
  Users,
  LogOut,
  X,
  Shield,
  User as UserIcon,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Avatar from '../ui/Avatar';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isManagerAdmin } = useAuth();
  const { info: toastInfo } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toastInfo('You have been logged out.');
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  // Role-Aware Navigation Config
  const memberNavItems = [
    { label: 'My Reports', path: '/reports', icon: FileText },
    { label: 'New Report', path: '/reports/new', icon: PlusCircle },
    { label: 'My Profile', path: '/profile', icon: UserCircle2 },
  ];

  const managerNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Review Inbox', path: '/reviews', icon: Inbox },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Team Members', path: '/team', icon: Users },
    { label: 'My Profile', path: '/profile', icon: UserCircle2 },
  ];

  const navItems = isManagerAdmin ? managerNavItems : memberNavItems;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/95 lg:bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 p-0.5 shadow-md shadow-brand-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div>
              <span className="block text-sm font-bold text-white leading-tight">
                Report <span className="text-brand-400">Sync</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Sisenco Digital
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2">
            {isManagerAdmin ? (
              <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isManagerAdmin ? 'Manager / Admin' : 'Team Member'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/reports' || item.path === '/dashboard' || item.path === '/profile'}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 shrink-0">
          <Link
            to="/profile"
            onClick={() => onClose?.()}
            className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800/80 mb-2 transition-colors group cursor-pointer"
            title="Go to profile settings"
          >
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="sm"
              ring={true}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </Link>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

