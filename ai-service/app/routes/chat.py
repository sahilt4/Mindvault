from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services.rag import rag_pipeline
from app.services.vector_store import vector_store

router = APIRouter(tags=["AI Query & Health"])

class QueryRequest(BaseModel):
    question: str
    userId: str
    history: Optional[List[Dict[str, str]]] = []
    documentId: Optional[str] = None

@router.post("/query")
async def query_knowledge(request: QueryRequest):
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if not request.userId:
        raise HTTPException(status_code=400, detail="userId is required for multitenant isolation")

    try:
        result = rag_pipeline.answer_query(
            question=request.question.strip(),
            user_id=request.userId,
            conversation_history=request.history,
            document_id=request.documentId
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query execution failed: {str(e)}")

@router.get("/health")
async def health_check():
    count = 0
    try:
        count = vector_store.count()
    except Exception:
        pass

    return {
        "status": "online",
        "service": "MindVault Python AI Service",
        "vector_db_type": settings.VECTOR_DB_TYPE,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL_NAME,
        "has_llm_key": bool(settings.LLM_API_KEY),
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "has_embedding_key": bool(settings.EMBEDDING_API_KEY),
        "vector_count": count
    }
