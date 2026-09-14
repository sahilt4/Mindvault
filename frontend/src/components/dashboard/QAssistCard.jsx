import React, { useState } from 'react';
import { Sparkles, Send, ArrowUpRight, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';

export const QAssistCard = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const samplePrompts = [
    "What do I know about my current projects?",
    "Summarize key takeaways from my notes",
    "What technologies are in my vault?"
  ];

  const handleAsk = async (queryText) => {
    const q = queryText || question;
    if (!q || !q.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer(null);
    setSources([]);

    try {
      const res = await api.post('/chat', { message: q.trim() });
      if (res.data?.message) {
        setAnswer(res.data.message.content);
        setSources(res.data.message.sources || []);
      }
    } catch (err) {
      setAnswer("Could not query your knowledge vault right now. Please ensure the backend and AI service are running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden glass-card rounded-2xl border border-blue-500/30 p-6 flex flex-col justify-between shadow-2xl shadow-blue-900/10 group">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 border border-blue-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">QAssist</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  RAG Powered
                </span>
              </div>
              <p className="text-xs text-slate-400">Ask questions about your personal stored knowledge</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <span>Full Chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prompt Suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(prompt);
                handleAsk(prompt);
              }}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/5 transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Answer Output Container */}
        {(isLoading || answer) && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 mb-4 animate-in fade-in duration-200">
            {isLoading ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching your knowledge vault & synthesizing answer...</span>
                </div>
                <div className="h-4 w-5/6 bg-slate-800/70 rounded skeleton-shimmer" />
                <div className="h-4 w-3/4 bg-slate-800/50 rounded skeleton-shimmer" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>

                {sources && sources.length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Sources Used:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/40"
                          title={s.snippet}
                        >
                          <span>{s.sourceType === 'pdf' ? '📄' : s.sourceType === 'note' ? '📝' : '📁'}</span>
                          <span className="font-medium truncate max-w-[180px]">{s.documentName}</span>
                          {s.pageNumber && <span className="text-slate-400">(p. {s.pageNumber})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="relative mt-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your knowledge..."
          disabled={isLoading}
          className="w-full glass-input rounded-xl text-sm pl-4 pr-12 py-3 placeholder:text-slate-500 focus:border-blue-500 shadow-inner disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
export default QAssistCard;
