# MindVault Free-Tier Cloud Deployment Guide

This guide details how to deploy the entire **MindVault** application for **$0 / month** using free-tier cloud services:

| Component | Platform | Free Tier Specifications |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Unlimited deployments, global CDN, automatic SSL |
| **Backend API** | [Render](https://render.com) | Free Web Service (Node.js runtime) |
| **AI / RAG Service** | [Render](https://render.com) | Free Web Service (Python 3 runtime) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 Sandbox (512MB storage, free forever) |
| **Vector Database** | [Pinecone](https://www.pinecone.io) | 1 Free Serverless Index (up to 100k vectors, persistent) |
| **LLM & Embeddings** | [Google AI Studio](https://aistudio.google.com) | Gemini API free tier (Gemini 1.5 Flash + text-embedding-004) |

---

## Architecture Overview

```
                      USER (Browser)
                            │
                            ▼
              ┌───────────────────────────┐
              │      Vercel Frontend      │
              │  (React 19 + Vite + SPA)  │
              └─────────────┬─────────────┘
                            │ HTTPS / REST
                            ▼
              ┌───────────────────────────┐
              │    Render Backend API     │
              │    (Node.js + Express)    │
              └─────────────┬─────────────┘
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐
   │   MongoDB Atlas   │         │ Render AI Service │
   │  (M0 Free Tier)   │         │ (Python FastAPI)  │
   └───────────────────┘         └─────────┬─────────┘
                                           │
                         ┌─────────────────┼─────────────────┐
                         ▼                 ▼                 ▼
                 ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
                 │   Pinecone    │ │  Google AI   │ │  Embeddings   │
                 │ Serverless DB │ │  Gemini API   │ │   (Gemini)    │
                 └───────────────┘ └───────────────┘ └───────────────┘
```

---

## Prerequisites (Accounts Needed)

1. **GitHub Account** (with this repository pushed to your account).
2. **MongoDB Atlas Account** ([cloud.mongodb.com](https://cloud.mongodb.com)).
3. **Pinecone Account** ([app.pinecone.io](https://app.pinecone.io)).
4. **Google AI Studio Key** ([aistudio.google.com](https://aistudio.google.com)).
5. **Render Account** ([render.com](https://render.com)).
6. **Vercel Account** ([vercel.com](https://vercel.com)).

---

## Step 1: Set Up MongoDB Atlas (Free Tier)

1. Log into [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a new cluster: select **M0 Free** tier (choose AWS / `us-east-1` or nearest region).
3. Under **Security > Database Access**:
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `mindvault_admin`) and a secure password.
   - Assign Role: **Read and write to any database**.
4. Under **Security > Network Access**:
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. *(Required so Render instances can connect).*
5. Go to **Database > Clusters > Connect > Drivers (Node.js)**:
   - Copy the connection string.
   - Replace `<password>` with your database user password and append `/mindvault`:
     ```text
     mongodb+srv://mindvault_admin:<password>@cluster0.xxxxx.mongodb.net/mindvault?retryWrites=true&w=majority
     ```
   - Save this URL for Step 4.

---

## Step 2: Set Up Pinecone Vector Database (Free Tier)

Render free-tier instances have ephemeral filesystems. Pinecone provides a persistent, hosted cloud vector database that retains all your embeddings through restarts, sleep cycles, and redeployments.

1. Log into [Pinecone](https://app.pinecone.io).
2. Go to **API Keys** and copy your **Pinecone API Key**.
3. MindVault will **automatically create** the serverless index `mindvault` on first run. If you prefer to create it manually in the Pinecone Console:
   - **Index Name**: `mindvault`
   - **Dimensions**: `768` (for Gemini `models/text-embedding-004`)
   - **Metric**: `cosine`
   - **Cloud**: `aws`
   - **Region**: `us-east-1`
4. Note your credentials:
   - `PINECONE_API_KEY=<your-key>`
   - `PINECONE_INDEX_NAME=mindvault`
   - `PINECONE_ENVIRONMENT=us-east-1`

---

## Step 3: Deploy the Python AI Service on Render

1. Log into [Render](https://dashboard.render.com).
2. Click **New + > Web Service**.
3. Connect your GitHub repository: `sahilt4/Mindvault`.
4. Configure service settings:
   - **Name**: `mindvault-ai`
   - **Region**: `Oregon (US West)` or `Ohio (US East)`
   - **Root Directory**: `ai-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Stable Python runtime |
| `LLM_PROVIDER` | `gemini` | LLM service provider |
| `LLM_API_KEY` | *(Your Gemini API Key)* | From Google AI Studio |
| `LLM_MODEL_NAME` | `gemini-1.5-flash` | Gemini model name |
| `EMBEDDING_PROVIDER` | `gemini` | Embedding provider |
| `EMBEDDING_API_KEY` | *(Your Gemini API Key)* | Embedding API key |
| `EMBEDDING_MODEL_NAME` | `models/text-embedding-004` | Embedding model |
| `VECTOR_DB_TYPE` | `pinecone` | Uses hosted persistent vector store |
| `PINECONE_API_KEY` | *(Your Pinecone API Key)* | From Pinecone console |
| `PINECONE_INDEX_NAME` | `mindvault` | Vector index name |
| `PINECONE_ENVIRONMENT` | `us-east-1` | Pinecone serverless region |
| `TOP_K` | `5` | Retrieved chunks per query |

6. Click **Create Web Service**.
7. Once deployed, copy your service URL (e.g. `https://mindvault-ai.onrender.com`).
   - You can test it in your browser: `https://mindvault-ai.onrender.com/health` should return `{"status":"online", ...}`.

---

## Step 4: Deploy the Node.js Backend on Render

1. In Render Dashboard, click **New + > Web Service**.
2. Connect your GitHub repository: `sahilt4/Mindvault`.
3. Configure service settings:
   - **Name**: `mindvault-backend`
   - **Region**: Same region as `mindvault-ai`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Advanced**, add the following **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | `5000` | Port assigned by Render |
| `MONGODB_URI` | *(Your MongoDB Atlas URI)* | From Step 1 |
| `JWT_SECRET` | *(Generate a 32+ char string)* | Secret for auth tokens |
| `AI_SERVICE_URL` | `https://mindvault-ai.onrender.com` | URL from Step 3 |
| `FRONTEND_URL` | `*` *(or update with Vercel URL)* | Allowed CORS origin |

5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g. `https://mindvault-backend.onrender.com`).
   - Test it in your browser: `https://mindvault-backend.onrender.com/api/health` should return `{"status":"ok", ...}`.

---

## Step 5: Deploy the React Frontend on Vercel

1. Log into [Vercel](https://vercel.com).
2. Click **Add New... > Project**.
3. Import your GitHub repository: `sahilt4/Mindvault`.
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build Command**: `npm run build` (detected automatically)
   - **Output Directory**: `dist` (detected automatically)
5. Expand **Environment Variables**:

| Name | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://mindvault-backend.onrender.com/api` |

*(Make sure to use your exact backend URL from Step 4 with `/api` at the end!)*

6. Click **Deploy**.
7. In ~60 seconds, your application will be live at `https://mindvault-xxxx.vercel.app`!
8. *(Optional)* Return to Render > `mindvault-backend` > Environment, and update `FRONTEND_URL` to your Vercel domain (`https://mindvault-xxxx.vercel.app`).

---

## Alternative: 1-Click Render Blueprint Deployment

If you prefer to deploy both Render services simultaneously:
1. Ensure `render.yaml` is in your repository root.
2. In Render, click **New + > Blueprint**.
3. Select your `sahilt4/Mindvault` repository.
4. Render will read `render.yaml` and prompt you for the secret values (`MONGODB_URI`, `LLM_API_KEY`, `PINECONE_API_KEY`, etc.).
5. Click **Apply Blueprint**. Both services will be built and linked together automatically!

---

## Free-Tier Behavior & Tips

- **Render Cold Starts**: Render free-tier services spin down after 15 minutes of inactivity. When you make a request after a period of inactivity, the service takes 30–50 seconds to spin back up. The backend client has an extended 25s timeout to tolerate spin-ups cleanly.
- **Persistent Knowledge**: Because your notes are stored in MongoDB Atlas and vector embeddings are stored in Pinecone, **no knowledge or vectors are ever lost** when Render services spin down or redeploy.
- **Offline / Local Development**: To develop locally, simply keep `VECTOR_DB_TYPE=chroma` in `ai-service/.env`. The application seamlessly uses local ChromaDB and local MongoDB without needing cloud keys!
