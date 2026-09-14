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


