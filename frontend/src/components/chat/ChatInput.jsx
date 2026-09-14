import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export const ChatInput = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 p-3 glass-card rounded-2xl border border-white/10 shadow-2xl">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask QAssist anything about your personal vault... (Press Enter to send)"
        disabled={isLoading}
        className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-32 py-1.5 px-2"
      />

      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20 cursor-pointer shrink-0 active:scale-95"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  );
};
export default ChatInput;
