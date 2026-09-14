import Chat from '../models/Chat.js';
import { aiServiceClient } from '../services/aiServiceClient.js';

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select('title createdAt updatedAt messages')
      .sort({ updatedAt: -1 });

    const formattedChats = chats.map(chat => ({
      _id: chat._id,
      title: chat.title,
      messageCount: chat.messages.length,
      lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content.slice(0, 80) : '',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    }));

    return res.status(200).json({
      success: true,
      chats: formattedChats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chats'
    });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chat conversation'
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message, chatId, documentId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    }

    if (!chat) {
      const generatedTitle = message.trim().slice(0, 40) + (message.length > 40 ? '...' : '');
      chat = new Chat({
        userId: req.user._id,
        title: generatedTitle,
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message.trim(),
      sources: []
    });

    // Query RAG pipeline via Python AI Service
    // Pass recent conversation history (last 6 messages)
    const history = chat.messages.slice(-7, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    let ragResult;
    try {
      ragResult = await aiServiceClient.queryRAG({
        question: message.trim(),
        userId: req.user._id,
        history,
        documentId
      });
    } catch (err) {
      ragResult = {
        answer: "I encountered an issue connecting to the AI knowledge retrieval engine. Please ensure the AI service is running.",
        sources: [],
        hasContext: false
      };
    }

    // Add assistant response with sources
    const assistantMessage = {
      role: 'assistant',
      content: ragResult.answer,
      sources: ragResult.sources || []
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    return res.status(200).json({
      success: true,
      chatId: chat._id,
      title: chat.title,
      message: assistantMessage,
      chat
    });
  } catch (error) {
    console.error('[Send Message Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI message'
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Chat conversation deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete chat'
    });
  }
};
