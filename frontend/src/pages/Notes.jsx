import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import NoteCard from '../components/notes/NoteCard';
import NoteFilterBar from '../components/notes/NoteFilterBar';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get('/notes', { params });
      if (res.data?.success) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory, search]);

  const handleSaveNote = async (noteData) => {
    setIsSaving(true);
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
      fetchNotes();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save note', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast('Note deleted from vault and vector store', 'info');
      setIsEditorOpen(false);
      setEditingNote(null);
      setViewingNote(null);
      fetchNotes();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete note', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Notes</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Capture thoughts, project documentation, and ideas. Everything is vectorized for QAssist.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <NoteFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onNewNote={() => {
          setEditingNote(null);
          setIsEditorOpen(true);
        }}
      />

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard count={6} />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Your knowledge vault is empty."
          description="Create your first note to get started capturing knowledge and powering QAssist."
          actionLabel="Create Note"
          onAction={() => {
            setEditingNote(null);
            setIsEditorOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
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
      )}

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={editingNote ? () => handleDeleteNote(editingNote._id) : null}
        initialData={editingNote}
        isLoading={isSaving}
      />

      {/* Note Detail Viewer Modal */}
      {viewingNote && (
        <Modal
          isOpen={Boolean(viewingNote)}
          onClose={() => setViewingNote(null)}
          title={viewingNote.title}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <Badge variant={viewingNote.category}>{viewingNote.category}</Badge>
              <span className="text-xs text-slate-500">
                Updated {new Date(viewingNote.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
              {viewingNote.content}
            </div>

            {viewingNote.tags && viewingNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                {viewingNote.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => {
                  const toEdit = viewingNote;
                  setViewingNote(null);
                  setEditingNote(toEdit);
                  setIsEditorOpen(true);
                }}
                className="text-xs px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
              >
                Edit Note
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Notes;
