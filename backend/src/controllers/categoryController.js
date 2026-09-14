import Note from '../models/Note.js';
import Document from '../models/Document.js';

// Default standard categories in MindVault
const DEFAULT_CATEGORIES = ['Work', 'College', 'Projects', 'Personal', 'General', 'Other'];

export const getAllCategories = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch notes and documents grouped by category for this user
    const [noteAgg, docAgg] = await Promise.all([
      Note.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            latestDate: { $max: '$updatedAt' }
          }
        }
      ]),
      Document.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            latestDate: { $max: '$createdAt' }
          }
        }
      ])
    ]);

    // Build category map
    const categoryMap = new Map();

    // Initialize with default categories
    DEFAULT_CATEGORIES.forEach((name) => {
      categoryMap.set(name.toLowerCase(), {
        name,
        notesCount: 0,
        documentsCount: 0,
        totalCount: 0,
        latestDate: null
      });
    });

    // Populate note aggregations
    noteAgg.forEach((item) => {
      const catName = item._id || 'Other';
      const key = catName.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: catName,
          notesCount: 0,
          documentsCount: 0,
          totalCount: 0,
          latestDate: null
        });
      }
      const entry = categoryMap.get(key);
      entry.notesCount = item.count;
      entry.totalCount += item.count;
      if (!entry.latestDate || new Date(item.latestDate) > new Date(entry.latestDate)) {
        entry.latestDate = item.latestDate;
      }
    });

    // Populate document aggregations
    docAgg.forEach((item) => {
      const catName = item._id || 'General';
      const key = catName.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: catName,
          notesCount: 0,
          documentsCount: 0,
          totalCount: 0,
          latestDate: null
        });
      }
      const entry = categoryMap.get(key);
      entry.documentsCount = item.count;
      entry.totalCount += item.count;
      if (!entry.latestDate || new Date(item.latestDate) > new Date(entry.latestDate)) {
        entry.latestDate = item.latestDate;
      }
    });

    const categories = Array.from(categoryMap.values()).sort((a, b) => {
      // Prioritize categories with items first, then alphabetical
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch categories'
    });
  }
};

export const getCategoryContents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const categoryRegex = new RegExp(`^${category.trim()}$`, 'i');

    const [notes, documents] = await Promise.all([
      Note.find({
        userId,
        category: categoryRegex
      }).sort({ updatedAt: -1 }),
      Document.find({
        userId,
        category: categoryRegex
      }).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      category,
      stats: {
        notesCount: notes.length,
        documentsCount: documents.length,
        totalCount: notes.length + documents.length
      },
      notes,
      documents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch category contents'
    });
  }
};
