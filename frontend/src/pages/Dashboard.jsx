import React, { useState, useEffect } from 'react';
import { FileText, FolderOpen, Tag, Database, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentKnowledge from '../components/dashboard/RecentKnowledge';
import QAssistCard from '../components/dashboard/QAssistCard';
import KnowledgeInsights from '../components/dashboard/KnowledgeInsights';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import { SkeletonCard, SkeletonRow } from '../components/common/Skeleton';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    notesCount: 0,
    documentsCount: 0,
    categoriesCount: 0,
    totalKnowledgeItems: 0
  });
  const [recentKnowledge, setRecentKnowledge] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/search/dashboard-stats');
      if (res.data?.success) {
        setStats(res.data.stats);
        setRecentKnowledge(res.data.recentKnowledge);
        setInsights(res.data.insights || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveNote = async (noteData) => {
    setIsSavingNote(true);
    try {
      await api.post('/notes', noteData);
      toast('Note created and indexed for AI retrieval!', 'success');
      setIsNoteModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create note', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Home</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Your knowledge. Your life. In one place.
          </p>
        </div>

        <QuickActions
          onNewNote={() => setIsNoteModalOpen(true)}
          onUploadDoc={() => navigate('/documents')}
          onAskAI={() => navigate('/chat')}
        />
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <SkeletonCard count={4} />
        ) : (
          <>
            <StatCard
              title="Notes"
              value={stats.notesCount}
              icon={FileText}
              color="blue"
              subtitle="Personal written notes"
              onClick={() => navigate('/notes')}
            />
            <StatCard
              title="Documents"
              value={stats.documentsCount}
              icon={FolderOpen}
              color="emerald"
              subtitle="Indexed PDFs & TXTs"
              onClick={() => navigate('/documents')}
            />
            <StatCard
              title="Categories"
              value={stats.categoriesCount}
              icon={Tag}
              color="purple"
              subtitle="Distinct knowledge topics"
              onClick={() => navigate('/categories')}
            />
            <StatCard
              title="Knowledge Items"
              value={stats.totalKnowledgeItems}
              icon={Database}
              color="amber"
              subtitle="Total searchable items"
              onClick={() => navigate('/search')}
            />
          </>
        )}
      </div>

      {/* Main Grid: Recent Knowledge (Left) + AI Assistant Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Knowledge Area */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Recent Knowledge</h2>
              <p className="text-xs text-slate-400">Latest updates across notes and documents</p>
            </div>
            <button
              onClick={() => navigate('/notes')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              View All Notes &rarr;
            </button>
          </div>

          {loading ? (
            <SkeletonRow count={4} />
          ) : (
            <>
              <RecentKnowledge
                items={recentKnowledge}
                onSelectNote={(id) => navigate('/notes')}
                onSelectDoc={(id) => navigate('/documents')}
              />
              <KnowledgeInsights insights={insights} />
            </>
          )}
        </div>

        {/* AI Assistant QAssist Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              AI Knowledge Assistant
            </h2>
            <p className="text-xs text-slate-400">Ask questions grounded in your vault</p>
          </div>

          <QAssistCard />
        </div>
      </div>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        isLoading={isSavingNote}
      />
    </div>
  );
};
export default Dashboard;
