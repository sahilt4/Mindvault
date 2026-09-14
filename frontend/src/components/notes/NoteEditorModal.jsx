import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { Sparkles, Loader2, AlignLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RelatedKnowledge from '../common/RelatedKnowledge';
import AIActions from '../common/AIActions';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['Work', 'College', 'Projects', 'Personal', 'Other'];

export const NoteEditorModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData = null,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Other');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(initialData.category || 'Other');
      setTagsInput(initialData.tags ? initialData.tags.join(', ') : '');
      setContent(initialData.content || '');
      setSummary(initialData.summary || null);
    } else {
      setTitle('');
      setCategory('Other');
      setTagsInput('');
      setContent('');
      setSummary(null);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim()) newErrors.content = 'Content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      title: title.trim(),
      category,
      tags,
      content: content.trim()
    });
  };

  const handleAskQAssist = () => {
    if (initialData?._id) {
      navigate(`/chat?documentId=${initialData._id}`);
      onClose();
    }
  };

  const handleNavigateRelated = (item) => {
    onClose();
    if (item.type === 'note') navigate('/notes');
    else navigate('/documents');
  };

  const handleGenerateSummary = async () => {
    if (!initialData?._id) return;
    setIsSummarizing(true);
    try {
      const res = await api.post(`/notes/${initialData._id}/summarize`);
      if (res.data?.success) {
        setSummary(res.data.summary);
        toast('Summary generated successfully', 'success');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to generate summary', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Note' : 'Create New Note'}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="Note title e.g. Quarterly OKRs or System Architecture"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input rounded-xl text-sm px-3.5 py-2.5 bg-slate-900 text-slate-200 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Tags (Comma Separated)"
              placeholder="frontend, rag, ideas"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Content
            </label>
            <textarea
              rows={8}
              placeholder="Write your note content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full glass-input rounded-xl text-sm p-3.5 placeholder:text-slate-500 resize-y transition-all ${
                errors.content ? 'border-red-500' : ''
              }`}
            />
            {errors.content && <span className="text-xs text-red-400">{errors.content}</span>}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
            {initialData && onDelete ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onDelete(initialData._id)}
                disabled={isLoading}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                {initialData ? 'Save Changes' : 'Create Note'}
              </Button>
            </div>
          </div>
        </form>

        {initialData && (
          <div className="flex flex-col gap-6 pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAskQAssist}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/20 font-semibold text-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Ask QAssist About Note
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || !!summary}
                  className={`flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                    summary 
                      ? 'bg-blue-900/40 text-blue-300/50 border border-blue-500/10 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-blue-950/60 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {isSummarizing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Summarizing...</>
                  ) : summary ? (
                    <><AlignLeft className="w-3 h-3" /> Summary Generated</>
                  ) : (
                    <><AlignLeft className="w-3 h-3" /> Generate Summary</>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowActions(!showActions)}
                  className={`flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border ${
                    showActions 
                      ? 'bg-purple-900 text-purple-300 border-purple-500/50'
                      : 'bg-slate-900 hover:bg-purple-950/60 text-purple-400 border-purple-500/30'
                  }`}
                >
                  More AI Actions...
                </button>
              </div>
            </div>

            {/* AI Actions Dropdown */}
            {showActions && (
              <AIActions documentId={initialData._id} type="note" />
            )}

            {summary && (
              <div className="p-4 rounded-xl glass-card border border-blue-500/20 bg-blue-950/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  AI Summary
                </h4>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}

            <RelatedKnowledge 
              documentId={initialData._id} 
              type="note" 
              onNavigate={handleNavigateRelated} 
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
export default NoteEditorModal;
