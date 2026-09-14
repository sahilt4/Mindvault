import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const getAiServiceUrl = () => {
  return process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
};

export const aiServiceClient = {
  async checkHealth() {
    try {
      // 25s timeout accommodates free tier cold-starts (e.g. Render spin-up)
      const response = await axios.get(`${getAiServiceUrl()}/health`, { timeout: 25000 });
      return response.data;
    } catch (error) {
      return { status: 'offline', error: error.message };
    }
  },

  async processDocument({ filePath, originalName, fileType, userId, documentId }) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), originalName);
      formData.append('userId', userId.toString());
      formData.append('documentId', documentId.toString());
      formData.append('originalName', originalName);
      formData.append('fileType', fileType);

      const response = await axios.post(`${getAiServiceUrl()}/process-document`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000 // 2 minutes for processing
      });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Process Document]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI document processing failed');
    }
  },

  async processNote({ noteId, title, content, category, tags, userId }) {
    try {
      const response = await axios.post(`${getAiServiceUrl()}/process-note`, {
        noteId: noteId.toString(),
        userId: userId.toString(),
        title,
        content,
        category,
        tags
      }, { timeout: 30000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Process Note]:', error.response?.data || error.message);
      // Do not throw so note saving in Mongo still succeeds even if vector sync temporarily fails
      return { success: false, error: error.message };
    }
  },

  async deleteVectors({ documentId, userId }) {
    try {
      const response = await axios.post(`${getAiServiceUrl()}/delete-vectors`, {
        documentId: documentId.toString(),
        userId: userId.toString()
      }, { timeout: 10000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Delete Vectors]:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  },

  async queryRAG({ question, userId, history = [], documentId = null }) {
    try {
      const payload = {
        question,
        userId: userId.toString(),
        history
      };
      if (documentId) {
        payload.documentId = documentId.toString();
      }

      const response = await axios.post(`${getAiServiceUrl()}/query`, payload, { timeout: 60000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Query RAG]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI query generation failed');
    }
  },

  async searchSemantic({ query, userId, top_k = 20 }) {
    try {
      const response = await axios.post(`${getAiServiceUrl()}/search`, {
        query,
        userId: userId.toString(),
        top_k
      }, { timeout: 30000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Semantic Search]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI semantic search failed');
    }
  },

  async searchRelated({ documentId, userId, top_k = 5 }) {
    try {
      const response = await axios.post(`${getAiServiceUrl()}/search/related`, {
        documentId: documentId.toString(),
        userId: userId.toString(),
        top_k
      }, { timeout: 30000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Related Search]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI related search failed');
    }
  },

  async summarizeDocument({ documentId, userId }) {
    try {
      const response = await axios.post(`${getAiServiceUrl()}/summarize-document`, {
        documentId: documentId.toString(),
        userId: userId.toString()
      }, { timeout: 60000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Summarize Document]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI document summarization failed');
    }
  },

  async executeAction({ documentId, userId, action }) {
    try {
      const response = await axios.post(`${getAiServiceUrl()}/action-document`, {
        documentId: documentId.toString(),
        userId: userId.toString(),
        action
      }, { timeout: 60000 });

      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Action Document]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI document action failed');
    }
  },

  async getInsights(userId) {
    try {
      const response = await axios.get(`${getAiServiceUrl()}/search/insights/${userId}`, { timeout: 60000 });
      return response.data;
    } catch (error) {
      console.error('[AI Service Error - Get Insights]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'AI insights generation failed');
    }
  }
};
