from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader
from app.utils.text_processing import clean_text
from app.services.llm import llm_service

class DocumentProcessor:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Extracts raw text pages/sections from a PDF, TXT, or Image document.
        Returns a list of dictionaries with 'text' and 'page' metadata.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Document file not found at: {file_path}")

        results: List[Dict[str, Any]] = []
        normalized_type = file_type.lower().replace(".", "")

        if normalized_type == "pdf":
            try:
                reader = PdfReader(str(path))
                for idx, page in enumerate(reader.pages):
                    raw_text = page.extract_text() or ""
                    cleaned = clean_text(raw_text)
                    if cleaned:
                        results.append({
                            "text": cleaned,
                            "page": idx + 1
                        })
                
                # OCR Fallback for scanned PDFs
                total_text_length = sum(len(r["text"]) for r in results)
                if total_text_length < 50:
                    try:
                        print(f"PDF {path.name} appears to be a scanned document. Falling back to Gemini OCR...")
                        ocr_text = llm_service.extract_text_from_file(str(path), mime_type="application/pdf")
                        cleaned_ocr = clean_text(ocr_text)
                        if cleaned_ocr:
                            results = [{
                                "text": cleaned_ocr,
                                "page": 1
                            }]
                    except Exception as ocr_e:
                        print(f"OCR fallback failed: {ocr_e}")
                        
            except Exception as e:
                raise ValueError(f"Failed to extract PDF contents: {str(e)}")

        elif normalized_type == "txt":
            try:
                content = ""
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                except UnicodeDecodeError:
                    with open(path, "r", encoding="latin-1") as f:
                        content = f.read()

                cleaned = clean_text(content)
                if cleaned:
                    results.append({
                        "text": cleaned,
                        "page": 1
                    })
            except Exception as e:
                raise ValueError(f"Failed to read TXT file: {str(e)}")
        
        elif normalized_type in ["png", "jpg", "jpeg", "image"]:
            try:
                print(f"Image {path.name} uploaded. Using Gemini OCR...")
                ocr_text = llm_service.extract_text_from_file(str(path))
                cleaned_ocr = clean_text(ocr_text)
                if cleaned_ocr:
                    results.append({
                        "text": cleaned_ocr,
                        "page": 1
                    })
            except Exception as e:
                raise ValueError(f"Failed to OCR image: {str(e)}")
                
        else:
            raise ValueError(f"Unsupported file type: {file_type}. Supported types are PDF, TXT, PNG, JPG.")

        return results

doc_processor = DocumentProcessor()
