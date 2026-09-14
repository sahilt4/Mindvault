import React, { useState, useEffect } from 'react';
import { Layers, FileText, File, ExternalLink, Loader2 } from 'lucide-react';
import api from '../../services/api';
import Badge from './Badge';

export const RelatedKnowledge = ({ documentId, type, onNavigate }) => {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const endpoint = type === 'note' ? `/notes/${documentId}/related` : `/documents/${documentId}/related`;
        const res = await api.get(endpoint);
        if (res.data?.success) {
          setRelated(res.data.related || []);
        }
      } catch (err) {
        console.error('Failed to fetch related knowledge:', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchRelated();
    }
  }, [documentId, type]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        Finding related knowledge in your vault...
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-400" />
        Related Knowledge
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((item) => (
          <div
            key={item._id}
            onClick={() => onNavigate(item)}
            className="p-3 rounded-xl glass-card border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              {item.type === 'note' ? (
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <File className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="text-slate-300 truncate group-hover:text-blue-400 transition-colors">
                {item.title}
              </span>
            </div>
            {item.semanticScore > 0 && (
              <span className="self-start text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {(item.semanticScore * 100).toFixed(0)}% Match
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedKnowledge;
