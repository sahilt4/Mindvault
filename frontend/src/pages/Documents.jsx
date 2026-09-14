import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import FileUploader from '../components/documents/FileUploader';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentViewerModal from '../components/documents/DocumentViewerModal';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/Skeleton';

export const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const pollingRef = useRef(null);

  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data?.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Poll every 4 seconds if any document is currently in 'processing' or 'uploading' status
    pollingRef.current = setInterval(() => {
      setDocuments((prevDocs) => {
        const hasProcessing = prevDocs.some((d) => d.status === 'processing' || d.status === 'uploading');
        if (hasProcessing) {
          fetchDocuments();
        }
        return prevDocs;
      });
    }, 4000);

    return () => clearInterval(pollingRef.current);
  }, []);

  const handleUpload = async (file, category) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast('Document uploaded! Processing text chunks and embeddings...', 'info');
      fetchDocuments();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document and its vector embeddings?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast('Document and vector chunks deleted from vault', 'info');
      fetchDocuments();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete document', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Documents</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Upload reference PDFs and TXT files. MindVault indexes every chunk into ChromaDB for QAssist.
        </p>
      </div>

      {/* Drag & Drop File Uploader */}
      <FileUploader onUpload={handleUpload} isUploading={isUploading} />

      {/* Document Library Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100">Your Indexed Documents</h2>
          <span className="text-xs text-slate-400 font-medium">
            {documents.length} {documents.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard count={3} />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            description="Upload your first document above. PDF and TXT files will be chunked, embedded, and made queryable by AI."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                onClick={() => setSelectedDocument(doc)}
                onDelete={handleDeleteDocument}
              />
            ))}
          </div>
        )}
      </div>

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </div>
  );
};
export default Documents;
