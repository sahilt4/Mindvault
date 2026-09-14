import os
import shutil
import tempfile
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.services.document_processor import doc_processor
from app.services.text_splitter import text_splitter
from app.services.vector_store import vector_store

router = APIRouter(tags=["Documents & Knowledge Ingestion"])

class ProcessNoteRequest(BaseModel):
    noteId: str
    userId: str
    title: str
    content: str
    category: Optional[str] = "Other"
    tags: Optional[List[str]] = []

class DeleteVectorsRequest(BaseModel):
    documentId: str
    userId: str

@router.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    userId: str = Form(...),
    documentId: str = Form(...),
    originalName: str = Form(...),
    fileType: str = Form(...)
):
    if not userId or not documentId:
        raise HTTPException(status_code=400, detail="userId and documentId are required")

    temp_dir = tempfile.mkdtemp()
    temp_file_path = Path(temp_dir) / file.filename

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Extract text
        pages = doc_processor.extract_text(str(temp_file_path), fileType)
        if not pages:
            raise HTTPException(status_code=400, detail="The uploaded document contains no extractable text")

        # 2. Chunk text with metadata
        base_meta = {
            "userId": str(userId),
            "documentId": str(documentId),
            "documentName": originalName,
            "sourceType": fileType.lower().replace(".", "")
        }
        chunks = text_splitter.split_document_pages(pages, base_meta)

        if not chunks:
            raise HTTPException(status_code=400, detail="Could not generate chunks from document content")

        # 3. Add to ChromaDB vector store
        vector_store.add_chunks(chunks)

        return {
            "status": "success",
            "message": f"Successfully indexed {len(chunks)} chunks for document {originalName}",
            "chunk_count": len(chunks),
            "documentId": documentId
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@router.post("/process-note")
async def process_note(request: ProcessNoteRequest):
    try:
        combined_text = f"Title: {request.title}\nCategory: {request.category}\nTags: {', '.join(request.tags or [])}\n\nContent:\n{request.content}"

        # Delete any existing vectors for this note first (to avoid stale duplicates on update)
        vector_store.delete_by_document(document_id=request.noteId, user_id=request.userId)

        base_meta = {
            "userId": str(request.userId),
            "documentId": str(request.noteId),
            "documentName": request.title,
            "sourceType": "note"
        }

        pages = [{"text": combined_text, "page": 1}]
        chunks = text_splitter.split_document_pages(pages, base_meta)

        if chunks:
            vector_store.add_chunks(chunks)

        return {
            "status": "success",
            "chunk_count": len(chunks),
            "noteId": request.noteId
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Note vector indexing failed: {str(e)}")

@router.post("/delete-vectors")
async def delete_vectors(request: DeleteVectorsRequest):
    try:
        vector_store.delete_by_document(document_id=request.documentId, user_id=request.userId)
        return {
            "status": "success",
            "message": f"Vectors for document {request.documentId} deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete vectors: {str(e)}")

class SummarizeRequest(BaseModel):
    documentId: str
    userId: str

@router.post("/summarize-document")
async def summarize_document(req: SummarizeRequest):
    try:
        results = vector_store.get_chunks(
            document_id=req.documentId,
            user_id=req.userId,
            limit=15
        )

        if not results or not results.get("documents") or len(results["documents"]) == 0:
            raise HTTPException(status_code=404, detail="Document chunks not found for summarization")

        # Combine text from chunks (limit to first ~15 chunks to avoid context window explosion)
        combined_text = "\n\n".join(results["documents"][:15])

        from app.services.llm import llm_service
        prompt = "Please provide a concise, structured summary of the following document text. Include an Overview, Key Points, and Important Concepts if applicable. Keep it brief and formatted with markdown.\n\n" + combined_text
        
        # Use a dummy context for the RAG prompt wrapper, or just use the LLM directly
        summary = llm_service.generate_response(
            question="Summarize this document in a structured format (Overview, Key Points, Concepts).",
            context_chunks=[{"content": combined_text, "documentName": "Document"}]
        )

        # Cleanup the summary (remove the sources block since it's just a summary)
        if "Based on your stored knowledge" in summary:
            summary = summary.split("Based on your stored knowledge")[0].strip()
        if "Sources:" in summary:
            summary = summary.split("Sources:")[0].strip()

        return {
            "success": True,
            "summary": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

class ActionRequest(BaseModel):
    documentId: str
    userId: str
    action: str

@router.post("/action-document")
async def action_document(req: ActionRequest):
    try:
        results = vector_store.get_chunks(
            document_id=req.documentId,
            user_id=req.userId,
            limit=15
        )

        if not results or not results.get("documents") or len(results["documents"]) == 0:
            raise HTTPException(status_code=404, detail="Document chunks not found for action")

        combined_text = "\n\n".join(results["documents"][:15])

        from app.services.llm import llm_service
        
        prompt_map = {
            "extract_action_items": "Extract a clear, concise bulleted list of action items or tasks from the following document text. If there are none, state 'No action items found.'",
            "explain_eli5": "Explain the core concepts of the following document text simply, as if I were a 5-year-old. Use analogies where helpful.",
            "translate_spanish": "Translate the following document text into natural-sounding Spanish. If it's too long, summarize the key points in Spanish.",
            "identify_risks": "Identify any potential risks, warnings, or areas of concern mentioned in the following document text."
        }

        instruction = prompt_map.get(req.action)
        if not instruction:
            instruction = f"Perform the following action on the text: {req.action}"

        result = llm_service.generate_response(
            question=f"{instruction}\n\nDocument Text:\n{combined_text}",
            context_chunks=[]
        )

        # Cleanup the response
        if "Based on your stored knowledge" in result:
            result = result.split("Based on your stored knowledge")[0].strip()
        if "Sources:" in result:
            result = result.split("Sources:")[0].strip()

        return {
            "success": True,
            "result": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Action failed: {str(e)}")
