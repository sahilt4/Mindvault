from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.retriever import retriever

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)

class SearchRequest(BaseModel):
    query: str
    userId: str
    top_k: int = 20

@router.post("")
def semantic_search(req: SearchRequest):
    try:
        chunks = retriever.retrieve_relevant_chunks(
            query=req.query,
            user_id=req.userId,
            top_k=req.top_k
        )
        
        # Group chunks by documentId to get the best snippet and score per document
        # ChromaDB returns sorted by relevance (best first), so the first time we see a docId is its best match.
        grouped_results = []
        seen_docs = set()
        
        for chunk in chunks:
            doc_id = chunk.get("documentId")
            if not doc_id:
                continue
                
            if doc_id not in seen_docs:
                seen_docs.add(doc_id)
                grouped_results.append({
                    "documentId": doc_id,
                    "score": chunk.get("score", 0.0),
                    "snippet": chunk.get("content", "").strip()
                })
                
        return {
            "success": True,
            "results": grouped_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RelatedSearchRequest(BaseModel):
    documentId: str
    userId: str
    top_k: int = 5

@router.post("/related")
def semantic_related(req: RelatedSearchRequest):
    try:
        from app.services.vector_store import vector_store
        raw_results = vector_store.query_related(
            document_id=req.documentId,
            user_id=req.userId,
            top_k=req.top_k
        )
        
        grouped_results = []
        seen_docs = set()
        
        for item in raw_results:
            meta = item.get("metadata", {})
            distance = item.get("distance", 1.0)
            score = max(0.0, 1.0 - (distance / 2.0))
            doc_id = meta.get("documentId")
            
            if not doc_id:
                continue
                
            if doc_id not in seen_docs:
                seen_docs.add(doc_id)
                grouped_results.append({
                    "documentId": doc_id,
                    "score": round(score, 3),
                    "snippet": item["text"].strip(),
                    "documentName": meta.get("documentName", "Untitled Document"),
                    "sourceType": meta.get("sourceType", "document")
                })
                
        return {
            "success": True,
            "results": grouped_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/{user_id}")
def get_insights(user_id: str):
    try:
        from app.services.vector_store import vector_store
        # Fetch up to 50 chunks for the user
        results = vector_store.get_chunks(user_id=user_id, limit=50)
        
        if not results or not results.get("documents") or len(results["documents"]) == 0:
            return {
                "success": True,
                "insights": "Not enough data to generate insights. Try adding more notes and documents."
            }
            
        combined_text = "\n\n".join(results["documents"])
        
        from app.services.llm import llm_service
        prompt = (
            "Analyze the following knowledge base excerpts and provide 3-4 high-level insights, "
            "recurring themes, or interesting connections between the documents. "
            "Format your response as a concise, bulleted list. Do not mention that you are an AI "
            "or that these are excerpts."
        )
        
        insight_result = llm_service.generate_response(
            question=f"{prompt}\n\nKnowledge Base:\n{combined_text}",
            context_chunks=[]
        )
        
        # Cleanup
        if "Based on your stored knowledge" in insight_result:
            insight_result = insight_result.split("Based on your stored knowledge")[0].strip()
        if "Sources:" in insight_result:
            insight_result = insight_result.split("Sources:")[0].strip()
            
        return {
            "success": True,
            "insights": insight_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
