import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalName: {
      type: String,
      required: true
    },
    storedName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'png', 'jpg', 'jpeg'],
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading'
    },
    errorMessage: {
      type: String,
      default: null
    },
    category: {
      type: String,
      default: 'General'
    },
    chunkCount: {
      type: Number,
      default: 0
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

documentSchema.index({ userId: 1, originalName: 'text' });

const Document = mongoose.model('Document', documentSchema);
export default Document;
