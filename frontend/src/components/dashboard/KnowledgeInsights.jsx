import React from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';

export const KnowledgeInsights = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Knowledge Insights
        </h2>
        <p className="text-xs text-slate-400">AI-generated connections from your vault</p>
      </div>

      <div className="p-5 rounded-2xl glass-card border border-amber-500/20 bg-amber-950/10">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          Vault Analysis
        </h4>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {insights}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeInsights;
