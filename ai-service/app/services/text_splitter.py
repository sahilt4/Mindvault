from typing import List, Dict, Any
from app.config import settings

class RecursiveTextSplitter:
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

    def _split_text(self, text: str) -> List[str]:
        if len(text) <= self.chunk_size:
            return [text] if text.strip() else []

        chunks: List[str] = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + self.chunk_size
            if end >= text_len:
                chunks.append(text[start:].strip())
                break

            # Find best separator to split on within the window
            best_split = -1
            segment = text[start:end]
            
            for sep in self.separators:
                pos = segment.rfind(sep)
                if pos != -1 and pos > int(self.chunk_size * 0.3):
                    best_split = start + pos + len(sep)
                    break

            if best_split == -1 or best_split <= start:
                best_split = end

            chunk_text = text[start:best_split].strip()
            if chunk_text:
                chunks.append(chunk_text)

            # Move start forward respecting overlap
            start = max(start + 1, best_split - self.chunk_overlap)

        return chunks

    def split_document_pages(
        self,
        pages: List[Dict[str, Any]],
        metadata_base: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Splits extracted document pages into structured chunk objects.
        """
        chunks: List[Dict[str, Any]] = []
        chunk_idx = 0

        for page_data in pages:
            page_text = page_data.get("text", "")
            page_num = page_data.get("page", 1)

            page_chunks = self._split_text(page_text)
            for chunk_str in page_chunks:
                chunk_obj = {
                    "text": chunk_str,
                    "metadata": {
                        **metadata_base,
                        "chunkIndex": chunk_idx,
                        "pageNumber": page_num
                    }
                }
                chunks.append(chunk_obj)
                chunk_idx += 1

        return chunks

text_splitter = RecursiveTextSplitter()
