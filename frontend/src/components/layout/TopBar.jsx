import React from 'react';
import { Vault, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0a0f1d]/90 backdrop-blur-xl border-b border-white/8">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md border border-blue-400/30">
          <Vault className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-white">MindVault</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
export default TopBar;
