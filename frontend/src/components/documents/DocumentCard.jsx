import React from 'react';
import { FileText, File, Trash2, Calendar, CheckCircle2, Clock, AlertTriangle, Layers, Image as ImageIcon } from 'lucide-react';
import Badge from '../common/Badge';

export const DocumentCard = ({ document, onClick, onDelete }) => {
  const isPdf = document.fileType === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg'].includes(document.fileType?.toLowerCase());

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Ready for AI
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3 animate-spin" />
            Processing Chunks...
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Processing Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
            Uploading...
          </span>
        );
    }
  };

  return (
    <div 
      onClick={onClick}
      className="glass-card glass-card-hover rounded-2xl border border-white/8 p-5 flex flex-col justify-between group cursor-pointer"
    >
      <div>
        {/* Card Header: Icon + Category + Delete */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isPdf
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : isImage
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isPdf ? <FileText className="w-6 h-6" /> : isImage ? <ImageIcon className="w-6 h-6" /> : <File className="w-6 h-6" />}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {document.fileType?.toUpperCase()} DOCUMENT
              </span>
              <Badge variant={document.category}>{document.category || 'General'}</Badge>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document._id);
            }}
            title="Delete Document & Chunks"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Title / Original Name */}
        <h4
          className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate mb-1"
          title={document.originalName}
        >
          {document.originalName}
        </h4>

        {/* File Metadata Details */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <span>{formatSize(document.fileSize)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatDate(document.createdAt)}
          </span>
          {document.chunkCount > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Layers className="w-3 h-3 text-blue-400" />
                {document.chunkCount} chunks
              </span>
            </>
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        {getStatusDisplay(document.status)}

        {document.errorMessage && (
          <span className="text-[11px] text-red-400 truncate max-w-[150px]" title={document.errorMessage}>
            {document.errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};
export default DocumentCard;
