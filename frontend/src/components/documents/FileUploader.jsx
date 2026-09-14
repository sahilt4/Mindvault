import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../common/Button';

export const FileUploader = ({ onUpload, isUploading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('General');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt', 'png', 'jpg', 'jpeg'].includes(ext)) {
      alert('Only .pdf, .txt, .png, and .jpg files are supported in MindVault.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;
    await onUpload(selectedFile, category);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass-card rounded-2xl border border-white/8 p-6 mb-8">
      <h3 className="text-base font-semibold text-slate-100 mb-1">Upload Document</h3>
      <p className="text-xs text-slate-400 mb-4">
        Upload PDF, TXT, or Image documents. They will be cleaned, chunked, embedded, and indexed for AI retrieval. OCR is supported.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : selectedFile
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-white/15 hover:border-blue-500/50 hover:bg-white/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-semibold text-emerald-400">
                {selectedFile.name}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB — Click or drop another file to replace
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-medium text-slate-200">
                Drop your documents here, or <span className="text-blue-400 underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Supported formats: PDF, TXT, PNG, JPG (up to 15MB)</p>
            </div>
          )}
        </div>

        {/* Category & Action Row */}
        {selectedFile && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input rounded-xl text-xs px-3 py-1.5 bg-slate-900 text-slate-200"
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="College">College</option>
                <option value="Projects">Projects</option>
                <option value="Research">Research</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUploading}
                icon={UploadCloud}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
export default FileUploader;
