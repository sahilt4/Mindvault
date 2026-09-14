import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  FolderOpen,
  FileText,
  Briefcase,
  GraduationCap,
  Code2,
  User,
  Tag,
  ArrowLeft,
  Search,
  Plus,
  Calendar,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import NoteCard from '../components/notes/NoteCard';
import DocumentCard from '../components/documents/DocumentCard';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCard, SkeletonRow } from '../components/common/Skeleton';

// Theme configuration per category
const CATEGORY_THEMES = {
  work: {
    icon: Briefcase,
    color: 'blue',
    badge: 'Work',
    gradient: 'from-blue-600/20 to-cyan-500/10',
    border: 'border-blue-500/30',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-400',
    description: 'Career, meetings, office projects, and business records'
  },
  college: {
    icon: GraduationCap,
    color: 'amber',
    badge: 'College',
    gradient: 'from-amber-600/20 to-orange-500/10',
    border: 'border-amber-500/30',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    description: 'Lectures, study materials, coursework, and academic research'
  },
  projects: {
    icon: Code2,
    color: 'cyan',
    badge: 'Projects',
    gradient: 'from-indigo-600/20 to-blue-500/10',
    border: 'border-cyan-500/30',
    accentBg: 'bg-cyan-500/10',
    accentText: 'text-cyan-400',
    description: 'Architecture plans, code notes, roadmaps, and sprint deliverables'
  },
  personal: {
    icon: User,
    color: 'emerald',
    badge: 'Personal',
    gradient: 'from-emerald-600/20 to-teal-500/10',
    border: 'border-emerald-500/30',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
    description: 'Journaling, personal reflections, habits, and life goals'
  },
  general: {
    icon: FolderOpen,
    color: 'purple',
    badge: 'General',
    gradient: 'from-purple-600/20 to-pink-500/10',
    border: 'border-purple-500/30',
    accentBg: 'bg-purple-500/10',
    accentText: 'text-purple-400',
    description: 'Reference manuals, uploaded PDFs, guides, and shared knowledge'
  },
  other: {
    icon: Tag,
    color: 'slate',
    badge: 'Other',
    gradient: 'from-slate-600/20 to-slate-800/20',
    border: 'border-slate-500/30',
    accentBg: 'bg-slate-500/10',
    accentText: 'text-slate-300',
    description: 'Miscellaneous snippets, unorganized thoughts, and quick captures'
  }
};

const getTheme = (categoryName) => {
  const key = (categoryName || 'other').toLowerCase();
  return (
    CATEGORY_THEMES[key] || {
      icon: Layers,
      color: 'blue',
      badge: categoryName,
      gradient: 'from-blue-600/20 to-indigo-500/10',
      border: 'border-blue-500/30',
      accentBg: 'bg-blue-500/10',
      accentText: 'text-blue-400',
      description: `${categoryName} knowledge collection`
    }
  );
};

export const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryParam = searchParams.get('category');

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Drilldown state
  const [categoryContents, setCategoryContents] = useState({ notes: [], documents: [] });
  const [loadingContents, setLoadingContents] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'notes' | 'documents'
  const [contentSearch, setContentSearch] = useState('');

  // Modals
  const [viewingNote, setViewingNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch all categories list
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await api.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast('Failed to load categories', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch items inside selected category
  const fetchCategoryContents = async (catName) => {
    try {
      setLoadingContents(true);
      const res = await api.get(`/categories/${encodeURIComponent(catName)}`);
      if (res.data?.success) {
        setCategoryContents({
          notes: res.data.notes || [],
          documents: res.data.documents || []
        });
      }
    } catch (err) {
      console.error('Failed to load category contents:', err);
      toast(`Failed to load contents for ${catName}`, 'error');
    } finally {
      setLoadingContents(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryParam) {
      fetchCategoryContents(selectedCategoryParam);
      setContentSearch('');
      setActiveTab('all');
    }
  }, [selectedCategoryParam]);

  const handleSelectCategory = (catName) => {
    setSearchParams({ category: catName });
  };

  const handleClearCategory = () => {
    setSearchParams({});
    fetchCategories();
  };

  // Note CRUD actions within category
  const handleSaveNote = async (noteData) => {
    setIsSavingNote(true);
    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, noteData);
        toast('Note updated successfully!', 'success');
      } else {
        await api.post('/notes', noteData);
        toast('Note created and indexed for AI retrieval!', 'success');
      }
      setIsEditorOpen(false);
      setEditingNote(null);
      if (selectedCategoryParam) {
        fetchCategoryContents(selectedCategoryParam);
      }
      fetchCategories();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save note', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      toast('Note removed from vault', 'info');
      if (selectedCategoryParam) {
        fetchCategoryContents(selectedCategoryParam);
      }
      fetchCategories();
    } catch (err) {
      toast('Failed to delete note', 'error');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast('Document and embeddings removed', 'info');
      if (selectedCategoryParam) {
        fetchCategoryContents(selectedCategoryParam);
      }
      fetchCategories();
    } catch (err) {
      toast('Failed to delete document', 'error');
    }
  };

  const handleCopyNoteContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Filter notes and docs by search keyword
  const filteredNotes = categoryContents.notes.filter((note) => {
    if (!contentSearch.trim()) return true;
    const q = contentSearch.toLowerCase();
    return (
      note.title?.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q) ||
      note.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const filteredDocs = categoryContents.documents.filter((doc) => {
    if (!contentSearch.trim()) return true;
    const q = contentSearch.toLowerCase();
    return doc.originalName?.toLowerCase().includes(q);
  });

  const totalFilteredCount =
    activeTab === 'all'
      ? filteredNotes.length + filteredDocs.length
      : activeTab === 'notes'
      ? filteredNotes.length
      : filteredDocs.length;

  const currentTheme = selectedCategoryParam ? getTheme(selectedCategoryParam) : null;
  const CurrentIcon = currentTheme ? currentTheme.icon : Layers;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {selectedCategoryParam ? (
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleClearCategory}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All Categories
              </button>
              <span className="text-xs text-slate-500">/</span>
              <span className="text-xs font-medium text-slate-300">{selectedCategoryParam}</span>
            </div>
          ) : null}

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {selectedCategoryParam ? (
              <>
                <div
                  className={`w-10 h-10 rounded-xl ${currentTheme?.accentBg} ${currentTheme?.border} border flex items-center justify-center ${currentTheme?.accentText}`}
                >
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <span>{selectedCategoryParam}</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Layers className="w-5 h-5" />
                </div>
                <span>Categories</span>
              </>
            )}
          </h1>

          <p className="text-sm text-slate-400 mt-1 font-medium">
            {selectedCategoryParam
              ? currentTheme?.description || `All notes and documents stored in ${selectedCategoryParam}`
              : 'Browse and organize your knowledge taxonomy across all vaults'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {selectedCategoryParam && (
            <button
              onClick={() => {
                setEditingNote(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Note in {selectedCategoryParam}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Category Ribbon (Sticky-friendly quick selector) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={handleClearCategory}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            !selectedCategoryParam
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          All Categories
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryParam?.toLowerCase() === cat.name.toLowerCase();
          const theme = getTheme(cat.name);
          const CatIcon = theme.icon;

          return (
            <button
              key={cat.name}
              onClick={() => handleSelectCategory(cat.name)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <CatIcon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                {cat.totalCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: All Categories Overview Grid */}
      {!selectedCategoryParam && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Knowledge Taxonomy</h2>
              <p className="text-xs text-slate-400">Select any category to explore its notes and documents</p>
            </div>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <SkeletonCard count={6} />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No Categories Available"
              description="Create your first note or upload a document to build your knowledge categories."
              actionLabel="Create Note"
              onAction={() => navigate('/notes')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const theme = getTheme(cat.name);
                const CatIcon = theme.icon;

                return (
                  <div
                    key={cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className="group relative overflow-hidden glass-card glass-card-hover p-6 rounded-2xl border border-white/8 hover:border-blue-500/40 cursor-pointer transition-all duration-300 flex flex-col justify-between hover:scale-[1.01]"
                  >
                    <div
                      className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${theme.gradient} rounded-full blur-3xl pointer-events-none transition-opacity opacity-40 group-hover:opacity-100`}
                    />

                    <div>
                      {/* Card Header: Icon + Total Count */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl ${theme.accentBg} ${theme.border} border flex items-center justify-center ${theme.accentText} shadow-md transition-transform group-hover:scale-110`}
                        >
                          <CatIcon className="w-6 h-6" />
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                            {cat.totalCount}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            {cat.totalCount === 1 ? 'Item' : 'Items'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors mb-1">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 font-normal">
                        {theme.description}
                      </p>
                    </div>

                    {/* Footer: Breakdown pills & link */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>{cat.notesCount} Notes</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <FolderOpen className="w-3 h-3 text-emerald-400" />
                          <span>{cat.documentsCount} Docs</span>
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Open &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Selected Category Contents Drilldown */}
      {selectedCategoryParam && (
        <div className="flex flex-col gap-6">
          {/* Controls Bar: Filter tabs & in-category search */}
          <div className="glass-card rounded-2xl border border-white/8 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Items ({categoryContents.notes.length + categoryContents.documents.length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Notes ({categoryContents.notes.length})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Documents ({categoryContents.documents.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                placeholder={`Search inside ${selectedCategoryParam}...`}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Contents Area */}
          {loadingContents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <SkeletonCard count={6} />
            </div>
          ) : totalFilteredCount === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={`No items in ${selectedCategoryParam}`}
              description={
                contentSearch
                  ? `No notes or documents matched "${contentSearch}" in this category.`
                  : `You don't have any notes or documents categorized under ${selectedCategoryParam} yet.`
              }
              actionLabel={!contentSearch ? `Create Note in ${selectedCategoryParam}` : 'Clear Filter'}
              onAction={
                !contentSearch
                  ? () => {
                      setEditingNote(null);
                      setIsEditorOpen(true);
                    }
                  : () => setContentSearch('')
              }
            />
          ) : (
            <div className="flex flex-col gap-8">
              {/* Notes Section (if tab is all or notes) */}
              {(activeTab === 'all' || activeTab === 'notes') && filteredNotes.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Notes ({filteredNotes.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        onOpen={(n) => setViewingNote(n)}
                        onEdit={(n) => {
                          setEditingNote(n);
                          setIsEditorOpen(true);
                        }}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section (if tab is all or documents) */}
              {(activeTab === 'all' || activeTab === 'documents') && filteredDocs.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      <span>Documents ({filteredDocs.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDocs.map((doc) => (
                      <DocumentCard key={doc._id} document={doc} onDelete={handleDeleteDoc} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note Reader Modal */}
      <Modal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        title={viewingNote?.title || 'Note Details'}
        maxWidth="max-w-2xl"
      >
        {viewingNote && (
          <div className="flex flex-col gap-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Badge variant={viewingNote.category}>{viewingNote.category}</Badge>
                <span className="text-xs text-slate-500">
                  Updated {new Date(viewingNote.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyNoteContent(viewingNote.content)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer"
                >
                  {copiedNote ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Note Full Body */}
            <div className="bg-[#080d19]/80 p-5 rounded-xl border border-white/5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-mono">
              {viewingNote.content}
            </div>

            {/* Tags */}
            {viewingNote.tags && viewingNote.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <Tag className="w-3.5 h-3.5 text-slate-500 mr-1" />
                {viewingNote.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        initialData={
          editingNote ||
          (selectedCategoryParam ? { category: selectedCategoryParam } : null)
        }
        isLoading={isSavingNote}
      />
    </div>
  );
};

export default Categories;
