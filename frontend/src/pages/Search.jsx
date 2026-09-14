import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, FileText, File, Calendar, ArrowRight, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ notes: [], documents: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ notes: [], documents: [], total: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: query.trim() } });
        if (res.data?.success) {
          setResults({
            notes: res.data.notes || [],
            documents: res.data.documents || [],
            total: res.data.total || 0
          });
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Knowledge Search
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Search across notes, tags, and document metadata in your vault.
        </p>
      </div>

      {/* Search Bar Input */}
      <div className="relative">
        <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search titles, content, categories, tags..."
          autoFocus
          className="w-full glass-input rounded-2xl text-base pl-12 pr-4 py-3.5 placeholder:text-slate-500 shadow-xl"
        />
      </div>

      {/* Search Output */}
      {query.trim() === '' ? (
        <div className="p-12 text-center glass-card rounded-2xl border border-white/5 text-slate-400 text-sm">
          Start typing above to search your personal knowledge vault.
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-sm text-blue-400 font-medium animate-pulse">
          Searching knowledge vault...
        </div>
      ) : results.total === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No matching knowledge found"
          description={`No notes or documents matched your search query "${query}".`}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Notes Results */}
          {results.notes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Notes ({results.notes.length})
              </h3>
              <div className="glass-card rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
                {results.notes.map((note) => (
                  <div
                    key={note._id}
                    onClick={() => navigate('/notes')}
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={note.category}>{note.category}</Badge>
                        {note.semanticScore > 0 && (
                          <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            Semantic Match ({(note.semanticScore * 100).toFixed(0)}%)
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                          {note.title}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                        </span>
                        {note.tags?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {note.tags.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                        {note.semanticSnippet ? `"...${note.semanticSnippet}..."` : note.content}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Results */}
          {results.documents.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <File className="w-4 h-4 text-emerald-400" />
                Documents ({results.documents.length})
              </h3>
              <div className="glass-card rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
                {results.documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate('/documents')}
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <Badge variant={doc.category}>{doc.category}</Badge>
                        {doc.semanticScore > 0 && (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Semantic Match ({(doc.semanticScore * 100).toFixed(0)}%)
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                          {doc.originalName}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        <span className="capitalize">
                          {doc.fileType} Document • {doc.status}
                        </span>
                      </div>
                      {doc.semanticSnippet && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic mt-1.5">
                          "...{doc.semanticSnippet}..."
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Search;
