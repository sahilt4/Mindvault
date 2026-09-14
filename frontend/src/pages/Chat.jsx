import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Plus, RefreshCw, AlertCircle, Loader2, FileText, Database } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import EmptyState from '../components/common/EmptyState';

export const Chat = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const [documentMeta, setDocumentMeta] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const { toast } = useToast();

  const fetchChats = async () => {
    try {
      const res = await api.get('/chat');
      if (res.data?.success) {
        setChats(res.data.chats);
        if (res.data.chats.length > 0 && !activeChatId) {
          loadChat(res.data.chats[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadChat = async (id) => {
    try {
      const res = await api.get(`/chat/${id}`);
      if (res.data?.success) {
        setActiveChatId(id);
        setMessages(res.data.chat.messages || []);
      }
    } catch (err) {
      toast('Failed to load conversation', 'error');
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (documentId) {
      const fetchDocMeta = async () => {
        try {
          const res = await api.get(`/documents/${documentId}`);
          if (res.data?.success) setDocumentMeta(res.data.document);
          else {
            const resNote = await api.get(`/notes/${documentId}`);
            if (resNote.data?.success) setDocumentMeta(resNote.data.note);
          }
        } catch(e) {
          try {
            const resNote = await api.get(`/notes/${documentId}`);
            if (resNote.data?.success) setDocumentMeta(resNote.data.note);
          } catch(e2) {
            console.error('Could not fetch document meta for chat');
          }
        }
      };
      fetchDocMeta();
    }
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    // Optimistic user message
    const tempUserMsg = {
      role: 'user',
      content: text.trim(),
      sources: [],
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsLoading(true);
    setLoadingStatus('Searching your knowledge...');

    const timer = setTimeout(() => {
      setLoadingStatus('Thinking & synthesizing grounded answer...');
    }, 1200);

    try {
      const payload = {
        message: text.trim(),
        chatId: activeChatId
      };
      if (documentId) {
        payload.documentId = documentId;
      }

      const res = await api.post('/chat', payload);

      if (res.data?.success) {
        if (!activeChatId) {
          setActiveChatId(res.data.chatId);
        }
        setMessages(res.data.chat?.messages || [
          ...messages,
          tempUserMsg,
          res.data.message
        ]);
        fetchChats();
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to get answer from AI', 'error');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while querying your personal knowledge vault. Please make sure the AI service is active.',
          sources: [],
          timestamp: new Date()
        }
      ]);
    } finally {
      clearTimeout(timer);
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  const handleDeleteChat = async (id) => {
    try {
      await api.delete(`/chat/${id}`);
      toast('Conversation deleted', 'info');
      if (activeChatId === id) {
        setActiveChatId(null);
        setMessages([]);
      }
      fetchChats();
    } catch (err) {
      toast('Failed to delete conversation', 'error');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[550px]">
      {/* Page Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-white/5 mb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              QAssist
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ask questions about your personal knowledge. Grounded strictly in your notes and documents.
            </p>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Thread</span>
          </button>
        </div>

        {/* Document Scope Indicator */}
        {documentId && (
          <div className="flex items-center gap-2 mt-3 p-2 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs w-fit">
            <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <FileText className="w-3.5 h-3.5" />
              Document Scope Active:
            </span>
            <span className="text-slate-300">
              {documentMeta ? (documentMeta.originalName || documentMeta.title) : 'Loading...'}
            </span>
          </div>
        )}
      </div>

      {/* Chat Workspace: History Sidebar (Left) + Messages/Input (Right) */}
      <div className="flex-1 flex flex-col sm:flex-row gap-6 min-h-0">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={loadChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />

        {/* Main Chat Stream Container */}
        <div className="flex-1 flex flex-col glass-card border border-white/8 rounded-2xl overflow-hidden min-h-0">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-xl">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-1">
                  How can QAssist assist your knowledge today?
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Ask anything about your notes, uploaded PDFs, or reference TXT documents. Every answer is context-verified.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 max-w-lg">
                  {[
                    'Summarize the key ideas from my notes',
                    'What documents discuss my project roadmap?',
                    'Find information related to system architecture'
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(example)}
                      className="text-xs px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-blue-950/60 text-slate-300 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 transition-all text-left cursor-pointer"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 my-4 p-4 rounded-2xl glass-card border border-blue-500/25 max-w-md animate-in fade-in">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-300">{loadingStatus}</p>
                      <p className="text-[11px] text-slate-400">Scoped strictly to your personal vault</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Field */}
          <div className="p-3 sm:p-4 border-t border-white/5 bg-[#090e1a]/80">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Chat;
