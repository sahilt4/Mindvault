from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
from app.config import settings
from app.services.embeddings import embedding_service

class BaseVectorStore(ABC):
    """
    Abstract Vector Store interface to decouple RAG business logic
    from specific vector database implementations (Chroma, Pinecone, Qdrant).
    """

    @abstractmethod
    def add_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        pass

    @abstractmethod
    def delete_by_document(self, document_id: str, user_id: str) -> None:
        pass

    @abstractmethod
    def query_similarity(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_document_embedding(self, document_id: str, user_id: str) -> Optional[List[float]]:
        pass

    @abstractmethod
    def query_related(
        self,
        document_id: str,
        user_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_chunks(
        self,
        document_id: str = None,
        user_id: str = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Retrieves raw chunk texts and metadata for a user or specific document.
        Returns: {"documents": List[str], "metadatas": List[Dict[str, Any]]}
        """
        pass

    @abstractmethod
    def count(self, user_id: str = None) -> int:
        pass


# ==============================================================================
# 1. ChromaDB Implementation (Local Dev / Self-Hosted)
# ==============================================================================
class ChromaVectorStore(BaseVectorStore):
    def __init__(self):
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        self.collection_name = settings.COLLECTION_NAME

        if settings.CHROMA_HOST:
            # Connect to remote Chroma server if configured
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        else:
            # Default to local persistent storage for development
            self.db_path = settings.VECTOR_DB_PATH
            self.client = chromadb.PersistentClient(
                path=self.db_path,
                settings=ChromaSettings(anonymized_telemetry=False)
            )

        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "MindVault user knowledge vectors"}
        )

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        # Verify strict multitenant isolation
        for meta in metadatas:
            if "userId" not in meta or not meta["userId"]:
                raise ValueError("CRITICAL SECURITY ERROR: Attempted to insert chunk without userId metadata")

        ids = [
            f"{c['metadata']['documentId']}_{c['metadata']['chunkIndex']}"
            for c in chunks
        ]

        embeddings = embedding_service.embed_documents(texts)

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def delete_by_document(self, document_id: str, user_id: str):
        try:
            self.collection.delete(
                where={
                    "$and": [
                        {"userId": {"$eq": str(user_id)}},
                        {"documentId": {"$eq": str(document_id)}}
                    ]
                }
            )
        except Exception as e:
            print(f"[Chroma Delete Warning]: {e}")

    def query_similarity(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        query_vec = embedding_service.embed_query(query)

        filters = [{"userId": {"$eq": str(user_id)}}]
        if document_id:
            filters.append({"documentId": {"$eq": str(document_id)}})

        user_filter = {"$and": filters} if len(filters) > 1 else filters[0]

        results = self.collection.query(
            query_embeddings=[query_vec],
            n_results=top_k,
            where=user_filter,
            include=["documents", "metadatas", "distances"]
        )

        formatted: List[Dict[str, Any]] = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else []
            distances = results["distances"][0] if results.get("distances") else []

            for i, doc_text in enumerate(docs):
                formatted.append({
                    "text": doc_text,
                    "metadata": metas[i] if i < len(metas) else {},
                    "distance": distances[i] if i < len(distances) else 1.0
                })

        return formatted

    def get_document_embedding(self, document_id: str, user_id: str) -> Optional[List[float]]:
        try:
            results = self.collection.get(
                where={
                    "$and": [
                        {"userId": {"$eq": str(user_id)}},
                        {"documentId": {"$eq": str(document_id)}}
                    ]
                },
                include=["embeddings"],
                limit=1
            )
            if results and results.get("embeddings") is not None and len(results["embeddings"]) > 0:
                return results["embeddings"][0]
        except Exception as e:
            print(f"[Chroma get_document_embedding Error]: {e}")
        return None

    def query_related(
        self,
        document_id: str,
        user_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        query_vec = self.get_document_embedding(document_id, user_id)
        if query_vec is None or len(query_vec) == 0:
            return []

        filter_cond = {
            "$and": [
                {"userId": {"$eq": str(user_id)}},
                {"documentId": {"$ne": str(document_id)}}
            ]
        }

        results = self.collection.query(
            query_embeddings=[query_vec],
            n_results=top_k,
            where=filter_cond,
            include=["documents", "metadatas", "distances"]
        )

        formatted: List[Dict[str, Any]] = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else []
            distances = results["distances"][0] if results.get("distances") else []

            for i, doc_text in enumerate(docs):
                formatted.append({
                    "text": doc_text,
                    "metadata": metas[i] if i < len(metas) else {},
                    "distance": distances[i] if i < len(distances) else 1.0
                })

        return formatted

    def get_chunks(
        self,
        document_id: str = None,
        user_id: str = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        filters = []
        if user_id:
            filters.append({"userId": {"$eq": str(user_id)}})
        if document_id:
            filters.append({"documentId": {"$eq": str(document_id)}})

        where = {"$and": filters} if len(filters) > 1 else (filters[0] if filters else None)

        res = self.collection.get(
            where=where,
            include=["documents", "metadatas"],
            limit=limit
        )
        return {
            "documents": res.get("documents", []) if res else [],
            "metadatas": res.get("metadatas", []) if res else []
        }

    def count(self, user_id: str = None) -> int:
        try:
            return self.collection.count()
        except Exception:
            return 0


# ==============================================================================
# 2. Pinecone Implementation (Hosted Cloud Serverless - Free Tier)
# ==============================================================================
class PineconeVectorStore(BaseVectorStore):
    """
    Persistent, hosted vector database using Pinecone Serverless Free Tier.
    Does not depend on any local filesystem storage.
    """
    def __init__(self):
        from pinecone import Pinecone, ServerlessSpec

        self.api_key = settings.PINECONE_API_KEY
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY is required when using Pinecone vector store")

        self.index_name = settings.PINECONE_INDEX_NAME
        self.pc = Pinecone(api_key=self.api_key)

        # Detect embedding dimension
        dummy_vec = embedding_service.embed_query("mindvault init")
        self.dim = len(dummy_vec) if dummy_vec else 768

        # Create serverless index if it doesn't already exist
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        if self.index_name not in existing_indexes:
            print(f"[Pinecone] Creating serverless index '{self.index_name}' (dim={self.dim}, metric=cosine)...")
            try:
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dim,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT or "us-east-1"
                    )
                )
            except Exception as e:
                print(f"[Pinecone Create Index Warning]: {e}")

        self.index = self.pc.Index(self.index_name)
        print(f"[Pinecone] Connected to persistent hosted index: {self.index_name}")

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        for meta in metadatas:
            if "userId" not in meta or not meta["userId"]:
                raise ValueError("CRITICAL SECURITY ERROR: Attempted to insert chunk without userId metadata")

        embeddings = embedding_service.embed_documents(texts)

        vectors_to_upsert = []
        for i, chunk in enumerate(chunks):
            chunk_id = f"{chunk['metadata']['documentId']}_{chunk['metadata']['chunkIndex']}"
            meta = dict(chunk["metadata"])
            # Store text inside metadata for retrieval
            meta["text"] = chunk["text"]
            # Ensure metadata values are Pinecone-compatible primitives
            for k, v in list(meta.items()):
                if v is None:
                    meta[k] = ""
                elif isinstance(v, (int, float, str, bool)):
                    meta[k] = v
                elif isinstance(v, list):
                    meta[k] = [str(x) for x in v]
                else:
                    meta[k] = str(v)

            vectors_to_upsert.append({
                "id": chunk_id,
                "values": embeddings[i],
                "metadata": meta
            })

        # Upsert in batches of 100
        batch_size = 100
        for b in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[b:b + batch_size]
            self.index.upsert(vectors=batch)

    def delete_by_document(self, document_id: str, user_id: str):
        try:
            self.index.delete(
                filter={
                    "userId": {"$eq": str(user_id)},
                    "documentId": {"$eq": str(document_id)}
                }
            )
        except Exception as e:
            print(f"[Pinecone Delete Warning]: {e}")

    def query_similarity(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        query_vec = embedding_service.embed_query(query)

        filter_dict = {"userId": {"$eq": str(user_id)}}
        if document_id:
            filter_dict["documentId"] = {"$eq": str(document_id)}

        res = self.index.query(
            vector=query_vec,
            top_k=top_k,
            filter=filter_dict,
            include_metadata=True
        )

        formatted: List[Dict[str, Any]] = []
        for match in (res.matches or []):
            meta = match.metadata or {}
            # Pinecone returns cosine similarity score [0.0, 1.0] where 1.0 is identical
            score = match.score if hasattr(match, "score") and match.score is not None else 0.0
            distance = max(0.0, 1.0 - score)

            formatted.append({
                "text": meta.get("text", ""),
                "metadata": meta,
                "distance": distance
            })

        return formatted

    def get_document_embedding(self, document_id: str, user_id: str) -> Optional[List[float]]:
        try:
            # Query top 1 chunk for the document with values included
            dummy_vec = [0.0] * self.dim
            res = self.index.query(
                vector=dummy_vec,
                top_k=1,
                filter={
                    "userId": {"$eq": str(user_id)},
                    "documentId": {"$eq": str(document_id)}
                },
                include_values=True
            )
            if res.matches and len(res.matches) > 0 and res.matches[0].values:
                return res.matches[0].values
        except Exception as e:
            print(f"[Pinecone get_document_embedding Error]: {e}")
        return None

    def query_related(
        self,
        document_id: str,
        user_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        query_vec = self.get_document_embedding(document_id, user_id)
        if query_vec is None or len(query_vec) == 0:
            return []

        res = self.index.query(
            vector=query_vec,
            top_k=top_k,
            filter={
                "userId": {"$eq": str(user_id)},
                "documentId": {"$ne": str(document_id)}
            },
            include_metadata=True
        )

        formatted: List[Dict[str, Any]] = []
        for match in (res.matches or []):
            meta = match.metadata or {}
            score = match.score if hasattr(match, "score") and match.score is not None else 0.0
            distance = max(0.0, 1.0 - score)

            formatted.append({
                "text": meta.get("text", ""),
                "metadata": meta,
                "distance": distance
            })

        return formatted

    def get_chunks(
        self,
        document_id: str = None,
        user_id: str = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        filter_dict = {}
        if user_id:
            filter_dict["userId"] = {"$eq": str(user_id)}
        if document_id:
            filter_dict["documentId"] = {"$eq": str(document_id)}

        dummy_vec = [0.0] * self.dim
        res = self.index.query(
            vector=dummy_vec,
            top_k=limit,
            filter=filter_dict or None,
            include_metadata=True
        )

        docs = []
        metas = []
        for m in (res.matches or []):
            meta = m.metadata or {}
            docs.append(meta.get("text", ""))
            metas.append(meta)

        return {"documents": docs, "metadatas": metas}

    def count(self, user_id: str = None) -> int:
        try:
            stats = self.index.describe_index_stats()
            return stats.total_vector_count or 0
        except Exception:
            return 0


# ==============================================================================
# 3. Qdrant Implementation (Hosted Cloud Free Tier)
# ==============================================================================
class QdrantVectorStore(BaseVectorStore):
    """
    Persistent hosted vector database using Qdrant Cloud Free Tier.
    """
    def __init__(self):
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams

        self.url = settings.QDRANT_URL
        self.api_key = settings.QDRANT_API_KEY
        self.collection_name = settings.QDRANT_COLLECTION_NAME

        if not self.url or not self.api_key:
            raise ValueError("QDRANT_URL and QDRANT_API_KEY are required for Qdrant vector store")

        self.client = QdrantClient(url=self.url, api_key=self.api_key)

        dummy_vec = embedding_service.embed_query("mindvault init")
        self.dim = len(dummy_vec) if dummy_vec else 768

        # Create collection if needed
        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.dim, distance=Distance.COSINE)
            )

        print(f"[Qdrant] Connected to hosted cluster: {self.collection_name}")

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        from qdrant_client.models import PointStruct
        import uuid

        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        for meta in metadatas:
            if "userId" not in meta or not meta["userId"]:
                raise ValueError("CRITICAL SECURITY ERROR: Attempted to insert chunk without userId metadata")

        embeddings = embedding_service.embed_documents(texts)
        points = []

        for i, chunk in enumerate(chunks):
            payload = dict(chunk["metadata"])
            payload["text"] = chunk["text"]
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{payload['documentId']}_{payload['chunkIndex']}"))

            points.append(PointStruct(
                id=point_id,
                vector=embeddings[i],
                payload=payload
            ))

        self.client.upsert(collection_name=self.collection_name, points=points)

    def delete_by_document(self, document_id: str, user_id: str):
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(key="userId", match=MatchValue(value=str(user_id))),
                        FieldCondition(key="documentId", match=MatchValue(value=str(document_id)))
                    ]
                )
            )
        except Exception as e:
            print(f"[Qdrant Delete Warning]: {e}")

    def query_similarity(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        query_vec = embedding_service.embed_query(query)
        must_conditions = [
            FieldCondition(key="userId", match=MatchValue(value=str(user_id)))
        ]
        if document_id:
            must_conditions.append(
                FieldCondition(key="documentId", match=MatchValue(value=str(document_id)))
            )

        search_res = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vec,
            query_filter=Filter(must=must_conditions),
            limit=top_k
        )

        formatted = []
        for hit in search_res:
            payload = hit.payload or {}
            score = hit.score or 0.0
            distance = max(0.0, 1.0 - score)
            formatted.append({
                "text": payload.get("text", ""),
                "metadata": payload,
                "distance": distance
            })
        return formatted

    def get_document_embedding(self, document_id: str, user_id: str) -> Optional[List[float]]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        try:
            res = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(key="userId", match=MatchValue(value=str(user_id))),
                        FieldCondition(key="documentId", match=MatchValue(value=str(document_id)))
                    ]
                ),
                limit=1,
                with_vectors=True
            )
            points, _ = res
            if points and len(points) > 0 and points[0].vector:
                return points[0].vector
        except Exception as e:
            print(f"[Qdrant get_document_embedding Error]: {e}")
        return None

    def query_related(
        self,
        document_id: str,
        user_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        query_vec = self.get_document_embedding(document_id, user_id)
        if query_vec is None or len(query_vec) == 0:
            return []

        search_res = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vec,
            query_filter=Filter(
                must=[FieldCondition(key="userId", match=MatchValue(value=str(user_id)))],
                must_not=[FieldCondition(key="documentId", match=MatchValue(value=str(document_id)))]
            ),
            limit=top_k
        )

        formatted = []
        for hit in search_res:
            payload = hit.payload or {}
            score = hit.score or 0.0
            distance = max(0.0, 1.0 - score)
            formatted.append({
                "text": payload.get("text", ""),
                "metadata": payload,
                "distance": distance
            })
        return formatted

    def get_chunks(
        self,
        document_id: str = None,
        user_id: str = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        must = []
        if user_id:
            must.append(FieldCondition(key="userId", match=MatchValue(value=str(user_id))))
        if document_id:
            must.append(FieldCondition(key="documentId", match=MatchValue(value=str(document_id))))

        res = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(must=must) if must else None,
            limit=limit,
            with_payload=True
        )
        points, _ = res
        docs = []
        metas = []
        for p in points:
            payload = p.payload or {}
            docs.append(payload.get("text", ""))
            metas.append(payload)
        return {"documents": docs, "metadatas": metas}

    def count(self, user_id: str = None) -> int:
        try:
            return self.client.count(collection_name=self.collection_name).count
        except Exception:
            return 0


# ==============================================================================
# Vector Store Factory
# ==============================================================================
def create_vector_store() -> BaseVectorStore:
    vtype = (settings.VECTOR_DB_TYPE or "").lower()

    if vtype == "pinecone" or (not vtype and settings.PINECONE_API_KEY):
        try:
            print("[VectorStore Factory] Initializing Pinecone Cloud Vector Store...")
            return PineconeVectorStore()
        except Exception as e:
            print(f"[VectorStore Factory Warning] Failed to initialize Pinecone ({e}), falling back to ChromaDB")

    elif vtype == "qdrant" or (not vtype and settings.QDRANT_URL and settings.QDRANT_API_KEY):
        try:
            print("[VectorStore Factory] Initializing Qdrant Cloud Vector Store...")
            return QdrantVectorStore()
        except Exception as e:
            print(f"[VectorStore Factory Warning] Failed to initialize Qdrant ({e}), falling back to ChromaDB")

    # Default fallback for local development
    print("[VectorStore Factory] Initializing local ChromaDB Vector Store...")
    return ChromaVectorStore()

vector_store: BaseVectorStore = create_vector_store()
