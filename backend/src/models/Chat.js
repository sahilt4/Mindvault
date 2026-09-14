import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sources: [
    {
      documentId: String,
      documentName: String,
      sourceType: String,
      chunkIndex: Number,
      snippet: String
    }
  ],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Conversation'
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
