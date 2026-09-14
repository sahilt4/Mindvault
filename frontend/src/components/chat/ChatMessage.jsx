import React, { useState } from 'react';
import { Sparkles, User, FileText, File, ExternalLink } from 'lucide-react';
import Modal from '../common/Modal';

export const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const [selectedSource, setSelectedSource] = useState(null);

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3.5 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white border border-blue-400/30'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-slate-400">
            {isUser ? 'You' : 'QAssist'}
          </span>
          <span className="text-[10px] text-slate-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20'
              : 'glass-card text-slate-100 rounded-tl-none border border-white/10 shadow-xl'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Sources Section for Assistant */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Referenced Knowledge Sources:
              </span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSource(s)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-blue-950 text-blue-300 border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer group/src text-left"
                  >
                    <span>{s.sourceType === 'pdf' ? '📄' : s.sourceType === 'note' ? '📝' : ['png', 'jpg', 'jpeg', 'webp'].includes(s.sourceType) ? '🖼️' : '📁'}</span>
                    <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
                      {s.documentName}
                    </span>
                    {s.pageNumber && (
                      <span className="text-[10px] text-slate-400">p.{s.pageNumber}</span>
                    )}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/src:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source Preview Modal */}
      {selectedSource && (
        <Modal
          isOpen={Boolean(selectedSource)}
          onClose={() => setSelectedSource(null)}
          title={`Source: ${selectedSource.documentName}`}
          maxWidth="max-w-xl"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 pb-2 border-b border-white/5">
              <span className="capitalize font-semibold text-blue-400">
                {selectedSource.sourceType}
              </span>
              <span>•</span>
              <span>Chunk #{selectedSource.chunkIndex}</span>
              {selectedSource.pageNumber && (
                <>
                  <span>•</span>
                  <span>Page {selectedSource.pageNumber}</span>
                </>
              )}
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                Extracted Context Snippet:
              </span>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedSource.snippet}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default ChatMessage;
