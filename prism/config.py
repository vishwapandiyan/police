"""
PRISM-PY Configuration Module

Centralizes all configuration for the PRISM AI/RAG subsystem.
"""

import os
from pathlib import Path
from typing import Optional, Literal
from dataclasses import dataclass, field


@dataclass
class NVIDIAConfig:
    """NVIDIA LLM API Configuration"""
    api_key: str = field(default_factory=lambda: os.getenv("NVIDIA_API_KEY", ""))
    base_url: str = field(default_factory=lambda: os.getenv(
        "NVIDIA_BASE_URL", 
        "https://integrate.api.nvidia.com/v1"
    ))
    model_id: str = field(default_factory=lambda: os.getenv(
        "NVIDIA_MODEL_ID", 
        "meta/llama-3.1-70b-instruct"
    ))
    timeout_seconds: int = field(default_factory=lambda: int(os.getenv("NVIDIA_TIMEOUT_SECONDS", "60")))
    max_retries: int = field(default_factory=lambda: int(os.getenv("NVIDIA_MAX_RETRIES", "3")))
    temperature: float = field(default_factory=lambda: float(os.getenv("NVIDIA_TEMPERATURE", "0.1")))
    max_tokens: int = field(default_factory=lambda: int(os.getenv("NVIDIA_MAX_TOKENS", "4096")))
    
    def __post_init__(self):
        if not self.api_key:
            raise ValueError("NVIDIA_API_KEY is required. Set it in environment or .env file.")


@dataclass
class EmbeddingConfig:
    """Embedding Model Configuration (reuses existing e5-base-v2)"""
    model_name: str = field(default_factory=lambda: os.getenv("EMBEDDING_MODEL", "intfloat/e5-base-v2"))
    batch_size: int = field(default_factory=lambda: int(os.getenv("EMBEDDING_BATCH_SIZE", "32")))
    device: str = field(default_factory=lambda: os.getenv("EMBEDDING_DEVICE", "auto"))


@dataclass
class ChunkingConfig:
    """Chunking Configuration (reuses existing settings)"""
    chunk_size: int = field(default_factory=lambda: int(os.getenv("CHUNK_SIZE", "1000")))
    chunk_overlap: int = field(default_factory=lambda: int(os.getenv("CHUNK_OVERLAP", "300")))
    
    def __post_init__(self):
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("CHUNK_OVERLAP must be less than CHUNK_SIZE")


@dataclass
class RetrievalConfig:
    """Retrieval Configuration"""
    top_k: int = field(default_factory=lambda: int(os.getenv("TOP_K", "5")))
    relevance_threshold: float = field(default_factory=lambda: float(os.getenv("RELEVANCE_THRESHOLD", "0.25")))
    hybrid_ranking_strategy: Literal["rrf", "weighted", "score_fusion"] = field(
        default_factory=lambda: os.getenv("HYBRID_RANKING_STRATEGY", "rrf")
    )
    max_query_expansions: int = field(default_factory=lambda: int(os.getenv("MAX_QUERY_EXPANSIONS", "4")))
    max_decomposed_questions: int = field(default_factory=lambda: int(os.getenv("MAX_DECOMPOSED_QUESTIONS", "5")))


@dataclass
class FAISSConfig:
    """FAISS Index Configuration (reuses existing)"""
    index_type: Literal["auto", "flat", "ivf", "hnsw"] = field(
        default_factory=lambda: os.getenv("FAISS_INDEX_TYPE", "auto")
    )
    index_dir: Path = field(default_factory=lambda: Path(os.getenv("FAISS_INDEX_DIR", "./vectorstore/faiss_index")))
    metadata_path: Path = field(default_factory=lambda: Path(os.getenv(
        "FAISS_METADATA_PATH", 
        "./vectorstore/faiss_index/index_metadata.pkl"
    )))


@dataclass
class IngestionConfig:
    """Document Ingestion Configuration"""
    ocr_enabled: bool = field(default_factory=lambda: os.getenv("OCR_ENABLED", "true").lower() == "true")
    max_upload_size_mb: int = field(default_factory=lambda: int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")))
    max_archive_files: int = field(default_factory=lambda: int(os.getenv("MAX_ARCHIVE_FILES", "200")))


@dataclass
class RoutingConfig:
    """Document Routing Configuration"""
    confidence_threshold: float = field(default_factory=lambda: float(os.getenv("ROUTE_CONFIDENCE_THRESHOLD", "0.75")))
    default_route: int = field(default_factory=lambda: int(os.getenv("DEFAULT_ROUTE", "1")))


@dataclass
class JurisdictionConfig:
    """Jurisdiction-aware Ranking Configuration"""
    search_order: list[str] = field(default_factory=lambda: [
        "same_station",
        "neighboring_stations", 
        "same_region",
        "district_wide",
        "puducherry_wide"
    ])
    weight_decay: float = field(default_factory=lambda: float(os.getenv("JURISDICTION_WEIGHT_DECAY", "0.2")))


@dataclass
class PRISMConfig:
    """Master PRISM Configuration"""
    nvidia: NVIDIAConfig = field(default_factory=NVIDIAConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    chunking: ChunkingConfig = field(default_factory=ChunkingConfig)
    retrieval: RetrievalConfig = field(default_factory=RetrievalConfig)
    faiss: FAISSConfig = field(default_factory=FAISSConfig)
    ingestion: IngestionConfig = field(default_factory=IngestionConfig)
    routing: RoutingConfig = field(default_factory=RoutingConfig)
    jurisdiction: JurisdictionConfig = field(default_factory=JurisdictionConfig)
    
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    
    @classmethod
    def from_env(cls) -> "PRISMConfig":
        """Create configuration from environment variables"""
        return cls()
    
    def validate(self) -> bool:
        """Validate configuration"""
        errors = []
        
        if not self.nvidia.api_key:
            errors.append("NVIDIA_API_KEY is required")
        
        if self.chunking.chunk_overlap >= self.chunking.chunk_size:
            errors.append("CHUNK_OVERLAP must be less than CHUNK_SIZE")
        
        if self.retrieval.relevance_threshold < 0 or self.retrieval.relevance_threshold > 1:
            errors.append("RELEVANCE_THRESHOLD must be between 0 and 1")
        
        if errors:
            raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
        
        return True


# Singleton instance
_config: Optional[PRISMConfig] = None


def get_config() -> PRISMConfig:
    """Get or create the global PRISM configuration"""
    global _config
    if _config is None:
        _config = PRISMConfig.from_env()
        _config.validate()
    return _config


def reset_config():
    """Reset configuration (useful for testing)"""
    global _config
    _config = None
