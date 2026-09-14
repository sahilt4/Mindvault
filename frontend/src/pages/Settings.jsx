import React, { useState, useEffect } from 'react';
import { User, Cpu, Database, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [health, setHealth] = useState({
    backend: 'checking',
    aiService: 'checking',
    details: null
  });

  const checkHealth = async () => {
    setHealth({ backend: 'checking', aiService: 'checking', details: null });

    try {
      const backendRes = await api.get('/health');
      const bOk = backendRes.data?.status === 'ok';

      let aiOk = false;
      let aiDetails = null;

      try {
        const aiRes = await fetch('http://127.0.0.1:8000/health');
        if (aiRes.ok) {
          aiDetails = await aiRes.json();
          aiOk = aiDetails.status === 'online';
        }
      } catch (e) {
        aiOk = false;
      }

      setHealth({
        backend: bOk ? 'online' : 'error',
        aiService: aiOk ? 'online' : 'offline',
        details: aiDetails
      });
    } catch (err) {
      setHealth({
        backend: 'error',
        aiService: 'offline',
        details: null
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim() });
      if (res.data?.success) {
        updateUser({ name: res.data.user.name });
        toast('Profile name updated successfully', 'success');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Manage your account and monitor system status.
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-card rounded-2xl border border-white/8 p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">User Account</h3>
            <p className="text-xs text-slate-400">Your profile details</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={isUpdating}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* System & Architecture Health */}
      <div className="glass-card rounded-2xl border border-white/8 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">System & AI Health</h3>
              <p className="text-xs text-slate-400">Microservice status and vector engine</p>
            </div>
          </div>

          <button
            onClick={checkHealth}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Node.js Backend */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Node.js Express API</span>
              <span className="text-sm font-semibold text-white">Port 5000</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                health.backend === 'online'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  health.backend === 'online' ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
              {health.backend}
            </span>
          </div>

          {/* Python AI Service */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Python FastAPI RAG</span>
              <span className="text-sm font-semibold text-white">Port 8000</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                health.aiService === 'online'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  health.aiService === 'online' ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
              {health.aiService}
            </span>
          </div>
        </div>

        {health.details && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-400 space-y-1.5 font-mono">
            <div>• LLM Provider: <span className="text-blue-400">{health.details.llm_provider}</span> ({health.details.llm_model})</div>
            <div>• Embedding Provider: <span className="text-purple-400">{health.details.embedding_provider}</span></div>
            <div>• ChromaDB Vectors: <span className="text-emerald-400">{health.details.vector_count} chunks indexed</span></div>
          </div>
        )}
      </div>

      {/* AI Configuration Info */}
      <div className="glass-card rounded-2xl border border-white/8 p-6">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5 mb-3">
          <Key className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Configuring AI Providers</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          MindVault V1 uses a flexible provider abstraction layer. To configure external AI APIs (Google Gemini, OpenAI, or local Ollama), specify them in <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">ai-service/.env</code>:
        </p>
        <pre className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-300 font-mono overflow-x-auto">
{`LLM_PROVIDER=gemini        # 'gemini' | 'openai' | 'ollama' | 'local'
LLM_API_KEY=your_key_here
EMBEDDING_PROVIDER=gemini  # 'gemini' | 'openai' | 'local'
EMBEDDING_API_KEY=your_key_here`}
        </pre>
      </div>
    </div>
  );
};
export default Settings;
