import Note from '../models/Note.js';
import Document from '../models/Document.js';
import { aiServiceClient } from '../services/aiServiceClient.js';

export const searchKnowledge = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        notes: [],
        documents: [],
        total: 0
      });
    }

    const query = q.trim();

    // 1. Get semantic matches from AI service
    let semanticResults = [];
    try {
      const aiRes = await aiServiceClient.searchSemantic({ query, userId: req.user._id, top_k: 20 });
      if (aiRes.success) {
        semanticResults = aiRes.results || [];
      }
    } catch (err) {
      console.warn('Semantic search failed, falling back to regex search:', err.message);
    }

    // 2. Extract matched IDs and create a map for score/snippet
    const matchMap = {};
    const matchedDocIds = [];

    semanticResults.forEach(match => {
      // Filter out poor semantic matches (score < 0.15)
      // This ensures we fall back to regex if no good semantic matches exist
      if (match.score >= 0.15) {
        matchedDocIds.push(match.documentId);
        matchMap[match.documentId] = {
          score: match.score,
          snippet: match.snippet
        };
      }
    });

    let notes = [];
    let documents = [];

    if (matchedDocIds.length > 0) {
      // 3. Fetch metadata from MongoDB using semantic IDs
      const [fetchedNotes, fetchedDocs] = await Promise.all([
        Note.find({ _id: { $in: matchedDocIds }, userId: req.user._id }).lean(),
        Document.find({ _id: { $in: matchedDocIds }, userId: req.user._id }).lean()
      ]);

      notes = fetchedNotes.map(n => ({
        ...n,
        semanticScore: matchMap[n._id.toString()]?.score || 0,
        semanticSnippet: matchMap[n._id.toString()]?.snippet || ''
      }));

      documents = fetchedDocs.map(d => ({
        ...d,
        semanticScore: matchMap[d._id.toString()]?.score || 0,
        semanticSnippet: matchMap[d._id.toString()]?.snippet || ''
      }));
    } else {
      // Fallback to regex if semantic search returns nothing or fails
      const regex = new RegExp(query, 'i');
      const [fetchedNotes, fetchedDocs] = await Promise.all([
        Note.find({
          userId: req.user._id,
          $or: [{ title: regex }, { content: regex }, { tags: regex }]
        }).lean().sort({ updatedAt: -1 }).limit(20),
        Document.find({
          userId: req.user._id,
          $or: [{ originalName: regex }, { category: regex }]
        }).lean().sort({ updatedAt: -1 }).limit(20)
      ]);
      
      notes = fetchedNotes;
      documents = fetchedDocs;
    }

    // 4. Sort results by semantic score (if available)
    notes.sort((a, b) => (b.semanticScore || 0) - (a.semanticScore || 0));
    documents.sort((a, b) => (b.semanticScore || 0) - (a.semanticScore || 0));

    return res.status(200).json({
      success: true,
      query,
      notes,
      documents,
      total: notes.length + documents.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search knowledge base'
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notesCount, documentsCount, recentNotes, recentDocs] = await Promise.all([
      Note.countDocuments({ userId }),
      Document.countDocuments({ userId }),
      Note.find({ userId }).sort({ updatedAt: -1 }).limit(5),
      Document.find({ userId }).sort({ createdAt: -1 }).limit(5)
    ]);

    // Compute distinct categories
    const noteCategories = await Note.distinct('category', { userId });
    const docCategories = await Document.distinct('category', { userId });
    const allCategories = new Set([...noteCategories, ...docCategories]);

    // Merge recent items
    const recentKnowledge = [
      ...recentNotes.map(n => ({
        id: n._id,
        title: n.title,
        type: 'note',
        category: n.category,
        date: n.updatedAt,
        tags: n.tags,
        preview: n.content.slice(0, 120)
      })),
      ...recentDocs.map(d => ({
        id: d._id,
        title: d.originalName,
        type: d.fileType === 'pdf' ? 'pdf' : 'document',
        category: d.category,
        date: d.createdAt,
        status: d.status,
        size: d.fileSize
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // Fetch Insights
    let insights = null;
    try {
      const aiRes = await aiServiceClient.getInsights(userId);
      if (aiRes.success) {
        insights = aiRes.insights;
      }
    } catch (err) {
      console.warn('Failed to fetch AI insights:', err.message);
    }

    return res.status(200).json({
      success: true,
      stats: {
        notesCount,
        documentsCount,
        categoriesCount: allCategories.size || 1,
        totalKnowledgeItems: notesCount + documentsCount
      },
      recentKnowledge,
      insights
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard statistics'
    });
  }
};
