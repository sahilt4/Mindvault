from typing import List, Dict, Any, Optional
from app.services.retriever import retriever
from app.services.llm import llm_service

class RAGPipeline:
    def answer_query(
        self,
        question: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end RAG pipeline:
        1. Retrieve relevant chunks strictly isolated to user_id (and optionally document_id)
        2. Validate context availability
        3. Invoke LLM abstraction with grounded context
        4. Package structured citations/sources
        """
        # 1. Retrieve user-scoped chunks
        chunks = retriever.retrieve_relevant_chunks(
            query=question,
            user_id=user_id,
            top_k=5,
            document_id=document_id
        )

        # 3. Generate grounded response
        answer = llm_service.generate_response(
            question=question,
            context_chunks=chunks,
            conversation_history=conversation_history
        )

        # 4. Check if answer indicates information not found
        is_not_found = "could not find" in answer.lower() or "not mentioned in your stored" in answer.lower() or "not in their vault" in answer.lower() or "not contained in the context" in answer.lower() or "not in your vault" in answer.lower()

        # 5. Format source citations (Consolidated by Document)
        sources: List[Dict[str, Any]] = []
        if not is_not_found and chunks:
            doc_map = {}
            for c in chunks:
                doc_id = c.get("documentId")
                if not doc_id:
                    continue
                
                if doc_id not in doc_map:
                    doc_map[doc_id] = {
                        "documentId": doc_id,
                        "documentName": c.get("documentName", "Knowledge Item"),
                        "sourceType": c.get("sourceType", "document"),
                        "pages": set(),
                        "snippets": []
                    }
                
                # Add page if exists
                if c.get("pageNumber"):
                    doc_map[doc_id]["pages"].add(c.get("pageNumber"))
                
                # Add snippet
                snippet = c.get("content", "")
                doc_map[doc_id]["snippets"].append(snippet[:150] + ("..." if len(snippet) > 150 else ""))

            # Convert map to list
            for doc in doc_map.values():
                pages_list = sorted(list(doc["pages"]))
                page_str = ", ".join(map(str, pages_list)) if pages_list else None
                
                sources.append({
                    "documentId": doc["documentId"],
                    "documentName": doc["documentName"],
                    "sourceType": doc["sourceType"],
                    "pageNumber": page_str,
                    "snippet": "\n\n---\n\n".join(doc["snippets"])
                })

        return {
            "answer": answer,
            "sources": sources,
            "hasContext": not is_not_found
        }

rag_pipeline = RAGPipeline()
