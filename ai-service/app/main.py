from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.documents import router as documents_router
from app.routes.chat import router as chat_router
from app.routes.search import router as search_router

app = FastAPI(
    title="MindVault AI Service",
    description="Python FastAPI RAG engine with ChromaDB and multi-provider LLM abstraction",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(search_router)

@app.get("/")
def root():
    return {
        "message": "MindVault AI RAG Service is operational.",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
