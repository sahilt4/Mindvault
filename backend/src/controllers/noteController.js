import Note from '../models/Note.js';
import { aiServiceClient } from '../services/aiServiceClient.js';

export const getNotes = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { userId: req.user._id };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
        { tags: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const notes = await Note.find(filter).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notes'
    });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    return res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch note'
    });
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const note = await Note.create({
      userId: req.user._id,
      title: title.trim(),
      content,
      category: category || 'Other',
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [])
    });

    // Vector sync in background (non-blocking for fast UI response)
    aiServiceClient.processNote({
      noteId: note._id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      userId: req.user._id
    }).catch(err => console.error('[Note Vector Sync Error]:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create note'
    });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) {
      note.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    await note.save();

    // Update vector store
    aiServiceClient.processNote({
      noteId: note._id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      userId: req.user._id
    }).catch(err => console.error('[Note Vector Update Error]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update note'
    });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Clean up vectors
    aiServiceClient.deleteVectors({
      documentId: note._id,
      userId: req.user._id
    }).catch(err => console.error('[Note Vector Deletion Error]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete note'
    });
  }
};

export const getRelatedNotes = async (req, res) => {
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
      Note.find({ _id: { $in: matchedIds }, userId: req.user._id }).lean(),
      import('../models/Document.js').then(m => m.default.find({ _id: { $in: matchedIds }, userId: req.user._id }).lean())
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
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch related knowledge' });
  }
};

export const summarizeNote = async (req, res) => {
  try {
    const documentId = req.params.id;
    let note = await Note.findOne({ _id: documentId, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (note.summary && note.summaryGeneratedAt) {
      return res.status(200).json({ success: true, summary: note.summary });
    }

    const aiRes = await aiServiceClient.summarizeDocument({
      documentId,
      userId: req.user._id
    });

    if (aiRes.success && aiRes.summary) {
      note.summary = aiRes.summary;
      note.summaryGeneratedAt = new Date();
      await note.save();
      return res.status(200).json({ success: true, summary: note.summary });
    }

    throw new Error('AI Service returned unsuccessful summarization');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to summarize note' });
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
