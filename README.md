# MindVault (V1)

> *"Your knowledge. Your life. One intelligent place."*

MindVault is a modern, dark-first personal knowledge vault and AI assistant application. It provides end-to-end knowledge capture across notes and documents (PDF & TXT), automated text chunking and vector embeddings with ChromaDB, multitenant security isolation, and context-grounded RAG (Retrieval-Augmented Generation) with clickable source citations.

---

## Architecture Overview

MindVault follows a clean, three-tier decoupled microservice architecture:

```
                  ┌───────────────────────────────┐
                  │    React + Vite Frontend      │
                  │ (Tailwind CSS, Lucide Icons)  │
                  └───────────────┬───────────────┘
                                  │ HTTP / REST (Port 5173)
                                  ▼
                  ┌───────────────────────────────┐
                  │   Node.js / Express Backend   │
                  │   (JWT, Mongoose, Multer)     │
                  └──────┬─────────────────┬──────┘
                         │                 │
         MongoDB (27017) │                 │ HTTP / REST (Port 8000)
                         ▼                 ▼
             ┌────────────────┐   ┌─────────────────────────────┐
             │    MongoDB     │   │   Python / FastAPI Service  │
             │ (Users, Notes, │   │  (Text Chunking, LangChain, │
             │   Documents,   │   │     ChromaDB, Multi-LLM)    │
             │     Chats)     │   └──────────────┬──────────────┘
             └────────────────┘                  │
                                                 ▼
                                        ┌────────────────┐
                                        │    ChromaDB    │
                                        │ (Local Vector  │
                                        │   Embeddings)  │
                                        └────────────────┘
```

---

## Implemented V1 Features

### 1. Authentication & Security
- User registration with password hashing (`bcryptjs`)
- User login issuing signed JWT tokens with 7-day expiration
- Protected routes and session recovery on page reload
- **Strict Multi-Tenant Isolation**: Vector chunks and database records are strictly scoped to the authenticated user's ID. No user can retrieve or access another user's knowledge.

### 2. Knowledge Management
- **Notes CRUD**: Create, edit, delete, view, search, and filter notes by category (`Work`, `College`, `Projects`, `Personal`, `Other`) and tags. Notes are automatically vectorized into ChromaDB for AI querying.
- **Documents Repository**: Drag-and-drop file upload supporting `.pdf` and `.txt` files up to 15MB.
- **Document Processing**: Asynchronous text extraction via `pypdf`, text cleaning, recursive character chunking (700 chars with 120-char overlap), and embedding generation.
- **Live Lifecycle Status**: `Uploading` &rarr; `Processing` &rarr; `Ready for AI` (with chunk count).

### 3. AI / RAG Pipeline (QAssist)
- Dedicated `/chat` page with previous conversation thread management.
- Prominent interactive **QAssist** panel on the dashboard with prompt suggestions and inline answers.
- Context-grounded synthesis using retrieved chunks strictly matching `userId`.
- Clickable source citations (`📄 filename.pdf (p. 2)`, `📝 Note title`) with snippet inspection modal.
- **Anti-Hallucination Enforced**: Clearly states when information is not found in the user's vault without hallucinating external facts.
- **Provider Abstraction Layer**: Pluggable support for Google Gemini, OpenAI, Ollama, and an extractive local fallback for offline/test environments.

### 4. Dashboard & UX
- Real-time knowledge statistics: Notes, Documents, Categories, Total Knowledge Items.
- Recent Knowledge stream showing newest notes and documents.
- Quick action buttons: *New Note*, *Upload Document*, *Ask AI*.
- Unified knowledge search with debounced querying.
- Full mobile-first responsiveness: Persistent sidebar on desktop, adaptive header and fixed bottom navigation with floating AI button on mobile.

---

## Folder Structure

```
mindvault/
├── frontend/                     # React 19 + Vite + Tailwind CSS
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── common/           # Button, Input, Modal, Badge, EmptyState, Skeleton
│       │   ├── layout/           # AppLayout, Sidebar, TopBar, MobileNav
│       │   ├── dashboard/        # StatCard, RecentKnowledge, QuickActions, QAssistCard
│       │   ├── notes/            # NoteCard, NoteEditorModal, NoteFilterBar
│       │   ├── documents/        # FileUploader, DocumentCard
│       │   └── chat/             # ChatMessage, ChatSidebar, ChatInput
│       ├── context/              # AuthContext, ToastContext
│       ├── pages/                # Login, Register, Dashboard, Notes, Documents, Chat, Search, Settings
│       ├── services/             # api.js (Axios instance with bearer token interceptors)
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── backend/                      # Node.js + Express API
│   ├── server.js                 # Entry point (port 5000)
│   ├── package.json
│   ├── .env                      # Local environment configuration
│   ├── uploads/                  # Uploaded PDF and TXT files
│   └── src/
│       ├── config/               # db.js (Mongoose connection)
│       ├── middleware/           # auth.js, upload.js (Multer)
│       ├── models/               # User.js, Note.js, Document.js, Chat.js
│       ├── controllers/          # auth, note, doc, chat, search controllers
│       ├── routes/               # Express route definitions
│       └── services/             # aiServiceClient.js
├── ai-service/                   # Python FastAPI RAG Service
│   ├── requirements.txt
│   ├── .env                      # AI provider keys and model settings
│   ├── chroma_db/                # Local ChromaDB persistent vector database
│   └── app/
│       ├── main.py               # FastAPI entry point (port 8000)
│       ├── config.py             # Provider settings
│       ├── routes/               # documents.py, chat.py
│       ├── services/
│       │   ├── document_processor.py # PDF (pypdf) & TXT extraction
│       │   ├── text_splitter.py  # Recursive character chunking
│       │   ├── embeddings.py     # Multi-provider embedding abstraction
│       │   ├── vector_store.py   # ChromaDB manager with userId isolation
│       │   ├── retriever.py      # Similarity ranking
│       │   ├── llm.py            # Multi-provider LLM abstraction
│       │   └── rag.py            # End-to-end RAG workflow
│       └── utils/
│           └── text_processing.py
├── test_e2e.py                   # Automated E2E verification test script
├── .env.example
├── .gitignore
└── README.md
```

---

## Environment Variables

### Root / Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mindvault
JWT_SECRET=mindvault_jwt_secret_dev_super_safe_key_987654321
AI_SERVICE_URL=http://127.0.0.1:8000
```

### Python AI Service (`ai-service/.env`)
```env
LLM_PROVIDER=gemini               # 'gemini' | 'openai' | 'ollama' | 'local'
LLM_API_KEY=                      # Your Gemini API Key (optional, defaults to local fallback if empty)
LLM_MODEL_NAME=gemini-1.5-flash

EMBEDDING_PROVIDER=gemini         # 'gemini' | 'openai' | 'local'
EMBEDDING_API_KEY=                # Your Embedding Key (or reuses LLM_API_KEY)
EMBEDDING_MODEL_NAME=models/text-embedding-004

VECTOR_DB_PATH=./chroma_db
CHUNK_SIZE=700
CHUNK_OVERLAP=120
TOP_K=5
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## How to Install & Run

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB running locally on `127.0.0.1:27017`

### 1. Run Python AI Service
```bash
cd ai-service
# Activate virtual environment
.\venv\Scripts\activate
# Start FastAPI service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Run Node.js Express Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Run React Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## How the RAG Pipeline Works

1. **Upload / Creation**: When a document or note is uploaded, text is extracted via `pypdf` or UTF-8 decoding and cleaned.
2. **Chunking**: The document is split using `RecursiveTextSplitter` into structured chunks with chunk indices, page numbers, document IDs, and the owner's `userId`.
3. **Vector Storage**: Embeddings are computed and saved into ChromaDB with metadata filters.
4. **Query Retrieval**: When a user queries QAssist:
   - The query is embedded.
   - ChromaDB executes a similarity search strictly filtered by `{"userId": {"$eq": user_id}}`.
   - Chunks are ranked and formatted into context blocks.
5. **Grounded Synthesis**:
   - If no relevant chunks match, the assistant immediately returns: *"I could not find any information about this in your personal knowledge vault."*
   - If chunks exist, the LLM generates a grounded response and attaches structured source objects (`documentId`, `documentName`, `sourceType`, `pageNumber`, `snippet`).

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Log in and receive JWT |
| `GET` | `/api/auth/me` | Fetch active user profile |
| `PUT` | `/api/auth/profile` | Update user name |
| `GET` | `/api/notes` | List notes (filter by category & search) |
| `POST` | `/api/notes` | Create note and sync to vector store |
| `GET` | `/api/notes/:id` | Get note by ID |
| `PUT` | `/api/notes/:id` | Update note and vector chunks |
| `DELETE` | `/api/notes/:id` | Delete note and vector chunks |
| `GET` | `/api/documents` | List uploaded documents with status |
| `POST` | `/api/documents/upload` | Upload `.pdf` or `.txt` document |
| `DELETE` | `/api/documents/:id` | Delete document and vector chunks |
| `GET` | `/api/chat` | List conversation threads |
| `POST` | `/api/chat` | Send question and receive RAG answer |
| `GET` | `/api/chat/:id` | Fetch conversation history |
| `DELETE` | `/api/chat/:id` | Delete conversation thread |
| `GET` | `/api/search` | Search across notes and document metadata |
| `GET` | `/api/search/dashboard-stats` | Get counts for dashboard cards |
| `GET` | `/api/health` | Backend health check |

---

## Automated Verification

The repository includes `test_e2e.py`, which executes all verification phases:
```bash
python test_e2e.py
```
Output:
```
========================================
STARTING MINDVAULT END-TO-END VERIFICATION
========================================
[OK] Backend is healthy: MindVault Express Backend
[OK] AI service is healthy: MindVault Python AI Service
[OK] User A registered successfully: Alice Innovator
[OK] Note created: Quantum Computing Architecture
[OK] Document uploaded: sample_vault_doc.txt (Status: ready, Chunks: 1)
[OK] Grounded answer verified with citations!
[OK] Note-based answer verified!
[OK] Anti-hallucination verified! QAssist stated info is not in knowledge base.
[OK] CRITICAL SECURITY TEST PASSED: User B cannot retrieve User A's knowledge!
========================================
ALL 9 E2E TEST PHASES PASSED WITH 100% SUCCESS!
========================================
```

---

## Known Limitations in V1
- Supported document types are limited to text-based `.pdf` and `.txt` files (OCR for scanned image PDFs is deferred to V2).
- Search across notes in MongoDB uses regex/keyword search; full semantic global search is planned for V2.

## Recommended Next Steps for V2
1. **Intelligent Categorization**: Automatic tagging and categorization suggested by LLM on ingestion.
2. **Automatic Summaries**: Executive summaries auto-generated for multi-page documents.
3. **Knowledge Connections**: Interactive graph or link suggestions between related notes.
