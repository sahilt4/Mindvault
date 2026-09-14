import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import { aiServiceClient } from '../services/aiServiceClient.js';

export const getDocuments = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = { userId: req.user._id };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    const documents = await Document.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch documents'
    });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.status(200).json({
      success: true,
      document: doc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch document'
    });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file (.pdf, .txt, .png, or .jpg)'
      });
    }

    const { originalname, filename, path: filePath, size } = req.file;
    const ext = path.extname(originalname).toLowerCase().replace('.', '');
    const category = req.body.category || 'General';

    // Create Mongo document with status 'processing'
    const doc = await Document.create({
      userId: req.user._id,
      originalName: originalname,
      storedName: filename,
      filePath,
      fileType: ext,
      fileSize: size,
      status: 'processing',
      category
    });

    // Asynchronously process via Python AI service
    (async () => {
      try {
        const result = await aiServiceClient.processDocument({
          filePath,
          originalName: originalname,
          fileType: ext,
          userId: req.user._id,
          documentId: doc._id
        });

        doc.status = 'ready';
        doc.chunkCount = result.chunk_count || result.chunks_count || 0;
        await doc.save();
        console.log(`[Document Processor] Doc ${doc._id} processed into ${doc.chunkCount} chunks.`);
      } catch (err) {
        console.error(`[Document Processor] Processing failed for ${doc._id}:`, err.message);
        doc.status = 'failed';
        doc.errorMessage = err.message || 'AI document processing failed';
        await doc.save();
      }
    })();

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and processing queued',
      document: doc
    });
  } catch (error) {
    console.error('[Upload Document Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document'
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from disk if exists
    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (e) {
        console.warn('Could not delete file from disk:', e.message);
      }
    }

    // Delete from Mongo
    await Document.findByIdAndDelete(doc._id);

    // Delete vector embeddings from ChromaDB
    aiServiceClient.deleteVectors({
      documentId: doc._id,
      userId: req.user._id
    }).catch(err => console.error('[Doc Vector Deletion Error]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete document'
    });
  }
};

export const getRelatedDocuments = async (req, res) => {
  try {
    const documentId = req.params.id;
    const aiRes = await aiServiceClient.searchRelated({
      documentId,
      userId: req.user._id,
      top_k: 5
    });

    if (!aiRes.success) {
      return res.status(200).json({ success: true, related: [] });
    }

    const matchedIds = aiRes.results.map(r => r.documentId);
    if (matchedIds.length === 0) {
      return res.status(200).json({ success: true, related: [] });
    }

    const [notes, docs] = await Promise.all([
      import('../models/Note.js').then(m => m.default.find({ _id: { $in: matchedIds }, userId: req.user._id }).lean()),
      Document.find({ _id: { $in: matchedIds }, userId: req.user._id }).lean()
    ]);

    const matchMap = {};
    aiRes.results.forEach(r => { matchMap[r.documentId] = r; });

    const related = [
      ...notes.map(n => ({
        _id: n._id,
        title: n.title,
        type: 'note',
        category: n.category,
        semanticScore: matchMap[n._id.toString()]?.score || 0,
        snippet: matchMap[n._id.toString()]?.snippet || ''
      })),
      ...docs.map(d => ({
        _id: d._id,
        title: d.originalName,
        type: 'document',
        category: d.category,
        semanticScore: matchMap[d._id.toString()]?.score || 0,
        snippet: matchMap[d._id.toString()]?.snippet || ''
      }))
    ].sort((a, b) => b.semanticScore - a.semanticScore);

    return res.status(200).json({ success: true, related });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch related documents' });
  }
};

export const summarizeDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    let doc = await Document.findOne({ _id: documentId, userId: req.user._id });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (doc.summary && doc.summaryGeneratedAt) {
      return res.status(200).json({ success: true, summary: doc.summary });
    }

    const aiRes = await aiServiceClient.summarizeDocument({
      documentId,
      userId: req.user._id
    });

    if (aiRes.success && aiRes.summary) {
      doc.summary = aiRes.summary;
      doc.summaryGeneratedAt = new Date();
      await doc.save();
      return res.status(200).json({ success: true, summary: doc.summary });
    }

    throw new Error('AI Service returned unsuccessful summarization');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to summarize document' });
  }
};

export const executeAction = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { action } = req.body;
    
    if (!action) {
      return res.status(400).json({ success: false, message: 'Action is required' });
    }

    const aiRes = await aiServiceClient.executeAction({
      documentId,
      userId: req.user._id,
      action
    });

    if (aiRes.success) {
      return res.status(200).json({ success: true, result: aiRes.result });
    }

    throw new Error('AI Service returned unsuccessful action execution');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to execute AI action' });
  }
};
