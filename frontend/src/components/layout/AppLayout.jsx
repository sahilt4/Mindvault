import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="w-10 h-10 rounded-xl bg-blue-600 animate-spin flex items-center justify-center">
          <div className="w-4 h-4 bg-[#080b11] rounded-md" />
        </div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Loading MindVault...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <Sidebar />
      <TopBar />
      <main className="flex-1 lg:pl-64 flex flex-col pb-20 lg:pb-8 min-h-screen">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
};
export default AppLayout;
