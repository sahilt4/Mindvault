import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Note content is required']
    },
    category: {
      type: String,
      enum: ['Work', 'College', 'Projects', 'Personal', 'Other'],
      default: 'Other'
    },
    tags: {
      type: [String],
      default: []
    },
    summary: {
      type: String,
      default: null
    },
    summaryGeneratedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ userId: 1, title: 'text', content: 'text' });

const Note = mongoose.model('Note', noteSchema);
export default Note;
