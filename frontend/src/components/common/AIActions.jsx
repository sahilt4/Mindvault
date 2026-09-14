import React, { useState } from 'react';
import { Sparkles, Loader2, ListTodo, Presentation, Languages, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ACTIONS = [
  { id: 'extract_action_items', label: 'Extract Action Items', icon: ListTodo },
  { id: 'explain_eli5', label: 'Explain like I\'m 5', icon: Presentation },
  { id: 'translate_spanish', label: 'Translate to Spanish', icon: Languages },
  { id: 'identify_risks', label: 'Identify Risks', icon: AlertTriangle }
];

export const AIActions = ({ documentId, type }) => {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState(null);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (actionId) => {
    setIsLoading(true);
    setActiveAction(actionId);
    setResult('');
    
    try {
      const endpoint = type === 'note' ? `/notes/${documentId}/action` : `/documents/${documentId}/action`;
      const res = await api.post(endpoint, { action: actionId });
      
      if (res.data?.success) {
        setResult(res.data.result);
        toast('Action completed successfully', 'success');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to execute action', 'error');
      setActiveAction(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleAction(id)}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border ${
              activeAction === id
                ? 'bg-purple-900/40 text-purple-300/50 border-purple-500/10'
                : 'bg-slate-900 hover:bg-purple-950/60 text-purple-400 border-purple-500/30'
            }`}
          >
            {isLoading && activeAction === id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {label}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-2 p-4 rounded-xl glass-card border border-purple-500/20 bg-purple-950/10 animate-in fade-in">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Action Result
          </h4>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIActions;
