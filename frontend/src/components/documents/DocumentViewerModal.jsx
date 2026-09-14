import React, { useState } from 'react';
import { FileText, File, Calendar, Layers, Image as ImageIcon, Sparkles, Loader2, AlignLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import RelatedKnowledge from '../common/RelatedKnowledge';
import AIActions from '../common/AIActions';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const DocumentViewerModal = ({ isOpen, onClose, document }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [summary, setSummary] = useState(document?.summary || null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Update local state when document changes
  React.useEffect(() => {
    if (document) {
      setSummary(document.summary || null);
    }
  }, [document]);

  if (!document) return null;

  const isPdf = document.fileType === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(document.fileType?.toLowerCase());

  const handleAskQAssist = () => {
    navigate(`/chat?documentId=${document._id}`);
    onClose();
  };

  const handleNavigateRelated = (item) => {
    onClose();
    if (item.type === 'note') navigate('/notes');
    else navigate('/documents');
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await api.post(`/documents/${document._id}/summarize`);
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
      title={document.originalName}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        {/* Document Header Metadata */}
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isPdf
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : isImage
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isPdf ? <FileText className="w-7 h-7" /> : isImage ? <ImageIcon className="w-7 h-7" /> : <File className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={document.category}>{document.category || 'General'}</Badge>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {document.fileType?.toUpperCase()} DOCUMENT
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(document.createdAt).toLocaleDateString()}
              </span>
              {document.chunkCount > 0 && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  {document.chunkCount} chunks indexed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Actions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6 border-b border-white/5">
          <button
            onClick={handleAskQAssist}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/20 font-semibold text-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Ask QAssist About Document
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
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
          <AIActions documentId={document._id} type="document" />
        )}

        {/* Summary Display */}
        {summary && (
          <div className="p-4 rounded-xl glass-card border border-blue-500/20 bg-blue-950/10 mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              AI Summary
            </h4>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}

        {/* Preview (Images only for now) */}
        {isImage && (
          <div className="rounded-xl overflow-hidden border border-white/10 flex justify-center bg-slate-950/50">
            <img 
              src={`${api.defaults.baseURL.replace('/api', '')}/uploads/${document.storedName}`} 
              alt={document.originalName}
              className="max-h-[400px] object-contain"
            />
          </div>
        )}

        {/* Related Knowledge Section */}
        <RelatedKnowledge 
          documentId={document._id} 
          type="document" 
          onNavigate={handleNavigateRelated} 
        />
      </div>
    </Modal>
  );
};

export default DocumentViewerModal;
