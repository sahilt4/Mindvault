import React from 'react';
import { Plus, Upload, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export const QuickActions = ({ onNewNote, onUploadDoc, onAskAI }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="primary"
        icon={Plus}
        onClick={onNewNote}
        className="flex-1 sm:flex-initial"
      >
        New Note
      </Button>
      <Button
        variant="secondary"
        icon={Upload}
        onClick={onUploadDoc}
        className="flex-1 sm:flex-initial"
      >
        Upload Document
      </Button>
      <Button
        variant="outline"
        icon={Sparkles}
        onClick={onAskAI}
        className="flex-1 sm:flex-initial border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
      >
        Ask AI
      </Button>
    </div>
  );
};
export default QuickActions;
