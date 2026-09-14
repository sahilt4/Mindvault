import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  FolderOpen,
  Search
} from 'lucide-react';

export const MobileNav = () => {
  const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Notes', path: '/notes', icon: FileText },
    { label: 'AI', path: '/chat', icon: Sparkles, isAi: true },
    { label: 'Docs', path: '/documents', icon: FolderOpen },
    { label: 'Search', path: '/search', icon: Search }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        if (item.isAi) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center -mt-5 relative transition-transform active:scale-95 ${
                  isActive ? 'scale-105' : ''
                }`
              }
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-blue-400/40">
                <Icon className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-blue-300 mt-1">AI</span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors min-w-[56px] ${
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
export default MobileNav;
