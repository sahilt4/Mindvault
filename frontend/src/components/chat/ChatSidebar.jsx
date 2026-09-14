import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';

export const ChatSidebar = ({
  chats = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat
}) => {
  return (
    <div className="w-full sm:w-72 flex flex-col glass-card border border-white/8 rounded-2xl overflow-hidden shrink-0 h-[480px] sm:h-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chat History
        </h4>
        <Button variant="primary" size="sm" icon={Plus} onClick={onNewChat}>
          New Chat
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {chats.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No previous conversations. Start a new chat with QAssist!
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat._id === activeChatId;
            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat._id);
                  }}
                  title="Delete Chat"
                  className="p-1 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default ChatSidebar;
