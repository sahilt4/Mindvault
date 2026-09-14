import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "MindVault AI Service"
    PROJECT_VERSION: str = "1.0.0"

    # LLM Configuration
    # Supported: "gemini", "openai", "ollama", "local"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-1.5-flash")

    # Embeddings Configuration
    # Supported: "gemini", "openai", "local"
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "gemini").lower()
    EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY") or os.getenv("LLM_API_KEY", "")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "models/text-embedding-004")

    # Vector Database Configuration
    # Supported: "chroma", "pinecone", "qdrant"
    VECTOR_DB_TYPE: str = os.getenv("VECTOR_DB_TYPE", "chroma").lower()
    
    # ChromaDB Configuration (Local or Remote)
    VECTOR_DB_PATH: str = os.getenv("VECTOR_DB_PATH", str(BASE_DIR / "chroma_db"))
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "mindvault_knowledge")
    CHROMA_HOST: str = os.getenv("CHROMA_HOST", "")
    CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", "8000"))

    # Pinecone Configuration (Hosted Serverless - Free Tier)
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "mindvault")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

    # Qdrant Configuration (Hosted Free Cluster)
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    QDRANT_COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "mindvault_knowledge")

    # Chunking Configuration
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "700"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "120"))

    # Retrieval Configuration
    TOP_K: int = int(os.getenv("TOP_K", "5"))

settings = Settings()
