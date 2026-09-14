import math
import hashlib
from typing import List
from app.config import settings

class EmbeddingService:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER
        self.api_key = settings.EMBEDDING_API_KEY
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self._init_client()

    def _init_client(self):
        if self.provider == "gemini" and self.api_key:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._gemini = genai
        elif self.provider == "openai" and self.api_key:
            from openai import OpenAI
            self._openai = OpenAI(api_key=self.api_key)

    def _local_fallback_embedding(self, text: str, dim: int = 384) -> List[float]:
        """
        Deterministic, normalized dense vector representation for local/offline operation.
        Allows testing RAG workflows without requiring an external paid API key.
        """
        vec = [0.0] * dim
        tokens = text.lower().split()
        if not tokens:
            return vec

        for token in tokens:
            # Hash token to dimension indices
            h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 4) % 2 == 0) else -1.0
            vec[idx] += sign

        # Normalize vector to unit length
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        # Gemini
        if self.provider == "gemini" and self.api_key:
            try:
                embeddings = []
                for text in texts:
                    res = self._gemini.embed_content(
                        model=self.model_name,
                        content=text,
                        task_type="retrieval_document"
                    )
                    embeddings.append(res["embedding"])
                return embeddings
            except Exception as e:
                print(f"[Gemini Embedding Warning] {e}, falling back to local embeddings")

        # OpenAI
        if self.provider == "openai" and self.api_key:
            try:
                res = self._openai.embeddings.create(
                    model=self.model_name or "text-embedding-3-small",
                    input=texts
                )
                return [item.embedding for item in res.data]
            except Exception as e:
                print(f"[OpenAI Embedding Warning] {e}, falling back to local embeddings")

        # Local fallback
        return [self._local_fallback_embedding(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        if not text:
            return [0.0] * 384

        if self.provider == "gemini" and self.api_key:
            try:
                res = self._gemini.embed_content(
                    model=self.model_name,
                    content=text,
                    task_type="retrieval_query"
                )
                return res["embedding"]
            except Exception as e:
                print(f"[Gemini Embedding Warning] {e}, falling back to local embeddings")

        if self.provider == "openai" and self.api_key:
            try:
                res = self._openai.embeddings.create(
                    model=self.model_name or "text-embedding-3-small",
                    input=[text]
                )
                return res.data[0].embedding
            except Exception as e:
                print(f"[OpenAI Embedding Warning] {e}, falling back to local embeddings")

        return self._local_fallback_embedding(text)

embedding_service = EmbeddingService()
