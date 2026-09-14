from typing import List, Dict, Any
from app.config import settings
from app.services.vector_store import vector_store

class Retriever:
    def retrieve_relevant_chunks(
        self,
        query: str,
        user_id: str,
        top_k: int = None,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        k = top_k or settings.TOP_K
        raw_results = vector_store.query_similarity(query=query, user_id=user_id, top_k=k, document_id=document_id)

        chunks: List[Dict[str, Any]] = []
        for item in raw_results:
            meta = item.get("metadata", {})
            distance = item.get("distance", 1.0)
            
            # Approximate relevance score from distance (lower distance = higher score)
            score = max(0.0, 1.0 - (distance / 2.0))

            chunks.append({
                "content": item["text"],
                "score": round(score, 3),
                "documentId": meta.get("documentId", ""),
                "documentName": meta.get("documentName", "Untitled Document"),
                "sourceType": meta.get("sourceType", "document"),
                "chunkIndex": meta.get("chunkIndex", 0),
                "pageNumber": meta.get("pageNumber", 1)
            })

        return chunks

retriever = Retriever()
