"""
NVIDIA Embeddings Provider

Provides embeddings using NVIDIA's embedding models via OpenAI-compatible API.
"""

import logging
import os
import numpy as np
from typing import List, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class NVIDIAEmbeddings:
    """
    NVIDIA embeddings provider using OpenAI client.
    
    Supports models like:
    - nvidia/nv-embedqa-e5-v5 (recommended for Q&A)
    - nvidia/nv-embed-v1
    - nvidia/nv-embedqa-mistral-7b-v2
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "nvidia/nv-embedqa-e5-v5",
        base_url: str = "https://integrate.api.nvidia.com/v1"
    ):
        """
        Initialize NVIDIA embeddings provider.
        
        Args:
            api_key: NVIDIA API key (or from env NVIDIA_EMBEDDING_API_KEY)
            model: Embedding model name
            base_url: NVIDIA API base URL
        """
        self.api_key = api_key or os.getenv("NVIDIA_EMBEDDING_API_KEY") or os.getenv("NVIDIA_API_KEY")
        self.model = model
        
        if not self.api_key:
            raise ValueError("NVIDIA API key required for embeddings")
        
        self.client = OpenAI(
            base_url=base_url,
            api_key=self.api_key
        )
        
        logger.info(f"Initialized NVIDIA embeddings with model: {model}")
    
    def embed_documents(
        self,
        texts: List[str],
        batch_size: int = 32
    ) -> np.ndarray:
        """
        Generate embeddings for a list of documents.
        
        Args:
            texts: List of text strings to embed
            batch_size: Number of texts to embed per batch
        
        Returns:
            numpy array of embeddings
        """
        if not texts:
            return np.array([])
        
        all_embeddings = []
        
        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                batch_embeddings = self._embed_batch(batch)
                all_embeddings.extend(batch_embeddings)
            except Exception as e:
                logger.error(f"Error embedding batch {i//batch_size}: {e}")
                # Add zero vectors for failed batch
                dim = 1024 if "nemotron" in self.model else 768
                all_embeddings.extend([np.zeros(dim) for _ in batch])
        
        return np.array(all_embeddings)
    
    def embed_query(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single query text.
        
        Args:
            text: Query text
        
        Returns:
            numpy array of embedding
        """
        embeddings = self._embed_batch([text])
        return embeddings[0] if embeddings else np.array([])
    
    def _embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Embed a batch of texts using NVIDIA API via OpenAI client.
        
        Args:
            texts: List of texts to embed
        
        Returns:
            List of embedding arrays
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts,
                encoding_format="float"
            )
            
            # Extract embeddings in order
            embeddings = []
            for item in sorted(response.data, key=lambda x: x.index):
                embedding = np.array(item.embedding, dtype=np.float32)
                embeddings.append(embedding)
            
            logger.debug(f"Generated embeddings for {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"NVIDIA embeddings API error: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings for this model"""
        dimensions = {
            "nvidia/nv-embedqa-e5-v5": 1024,
            "nvidia/nv-embed-v1": 4096,
            "nvidia/nv-embedqa-mistral-7b-v2": 4096
        }
        
        return dimensions.get(self.model, 1024)


def test_nvidia_embeddings():
    """Test NVIDIA embeddings functionality"""
    try:
        embedder = NVIDIAEmbeddings()
        
        # Test single embedding
        query_embedding = embedder.embed_query("What is the proposal about?")
        print(f"✓ Query embedding shape: {query_embedding.shape}")
        
        # Test batch embeddings
        docs = [
            "Deploy CCTV cameras at Central Police Station",
            "Procure 10 new patrol vehicles",
            "Training program for cybercrime investigation"
        ]
        doc_embeddings = embedder.embed_documents(docs)
        print(f"✓ Document embeddings shape: {doc_embeddings.shape}")
        
        print("✅ NVIDIA embeddings working!")
        return True
        
    except Exception as e:
        print(f"❌ NVIDIA embeddings test failed: {e}")
        return False


if __name__ == "__main__":
    test_nvidia_embeddings()
