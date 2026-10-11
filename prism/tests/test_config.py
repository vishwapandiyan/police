"""
Tests for PRISM configuration
"""

import pytest
import os

from prism.config import (
    NVIDIAConfig,
    ChunkingConfig,
    RetrievalConfig,
    PRISMConfig,
    get_config,
    reset_config
)


class TestNVIDIAConfig:
    """Test NVIDIA configuration"""
    
    def test_nvidia_config_requires_api_key(self):
        """Test that NVIDIA config requires API key"""
        # Temporarily clear environment
        old_key = os.getenv("NVIDIA_API_KEY")
        if old_key:
            del os.environ["NVIDIA_API_KEY"]
        
        try:
            with pytest.raises(ValueError, match="NVIDIA_API_KEY is required"):
                config = NVIDIAConfig()
        finally:
            # Restore
            if old_key:
                os.environ["NVIDIA_API_KEY"] = old_key
    
    def test_nvidia_config_with_api_key(self):
        """Test creating NVIDIA config with API key"""
        config = NVIDIAConfig(api_key="test-key")
        
        assert config.api_key == "test-key"
        assert config.timeout_seconds > 0
        assert config.max_retries > 0
        assert 0.0 <= config.temperature <= 1.0
    
    def test_nvidia_config_from_env(self):
        """Test loading NVIDIA config from environment"""
        os.environ["NVIDIA_API_KEY"] = "env-test-key"
        os.environ["NVIDIA_TIMEOUT_SECONDS"] = "120"
        os.environ["NVIDIA_TEMPERATURE"] = "0.5"
        
        config = NVIDIAConfig()
        
        assert config.api_key == "env-test-key"
        assert config.timeout_seconds == 120
        assert config.temperature == 0.5
        
        # Cleanup
        del os.environ["NVIDIA_TIMEOUT_SECONDS"]
        del os.environ["NVIDIA_TEMPERATURE"]


class TestChunkingConfig:
    """Test chunking configuration"""
    
    def test_chunking_config_defaults(self):
        """Test default chunking config"""
        config = ChunkingConfig()
        
        assert config.chunk_size == 1000
        assert config.chunk_overlap == 300
    
    def test_chunking_config_validation(self):
        """Test that overlap must be less than size"""
        with pytest.raises(ValueError, match="CHUNK_OVERLAP must be less than CHUNK_SIZE"):
            config = ChunkingConfig(chunk_size=100, chunk_overlap=100)
    
    def test_chunking_config_from_env(self):
        """Test loading chunking config from environment"""
        os.environ["CHUNK_SIZE"] = "2000"
        os.environ["CHUNK_OVERLAP"] = "400"
        
        config = ChunkingConfig()
        
        assert config.chunk_size == 2000
        assert config.chunk_overlap == 400
        
        # Cleanup
        del os.environ["CHUNK_SIZE"]
        del os.environ["CHUNK_OVERLAP"]


class TestRetrievalConfig:
    """Test retrieval configuration"""
    
    def test_retrieval_config_defaults(self):
        """Test default retrieval config"""
        config = RetrievalConfig()
        
        assert config.top_k == 5
        assert config.relevance_threshold == 0.25
        assert config.hybrid_ranking_strategy in ["rrf", "weighted", "score_fusion"]
    
    def test_retrieval_config_from_env(self):
        """Test loading retrieval config from environment"""
        os.environ["TOP_K"] = "10"
        os.environ["RELEVANCE_THRESHOLD"] = "0.5"
        os.environ["MAX_QUERY_EXPANSIONS"] = "6"
        
        config = RetrievalConfig()
        
        assert config.top_k == 10
        assert config.relevance_threshold == 0.5
        assert config.max_query_expansions == 6
        
        # Cleanup
        del os.environ["TOP_K"]
        del os.environ["RELEVANCE_THRESHOLD"]
        del os.environ["MAX_QUERY_EXPANSIONS"]


class TestPRISMConfig:
    """Test main PRISM configuration"""
    
    def test_prism_config_creation(self):
        """Test creating PRISM config"""
        os.environ["NVIDIA_API_KEY"] = "test-key"
        
        config = PRISMConfig()
        
        assert isinstance(config.nvidia, NVIDIAConfig)
        assert isinstance(config.chunking, ChunkingConfig)
        assert isinstance(config.retrieval, RetrievalConfig)
        assert config.nvidia.api_key == "test-key"
    
    def test_prism_config_validation(self):
        """Test config validation"""
        os.environ["NVIDIA_API_KEY"] = "test-key"
        
        config = PRISMConfig()
        
        # Should pass validation
        assert config.validate() == True
    
    def test_prism_config_validation_fails_no_key(self):
        """Test validation fails without API key"""
        old_key = os.getenv("NVIDIA_API_KEY")
        if old_key:
            del os.environ["NVIDIA_API_KEY"]
        
        try:
            config = PRISMConfig()
            # Manually bypass the NVIDIAConfig validation to test PRISMConfig validation
            config.nvidia.api_key = ""
            
            with pytest.raises(ValueError, match="NVIDIA_API_KEY is required"):
                config.validate()
        finally:
            if old_key:
                os.environ["NVIDIA_API_KEY"] = old_key
    
    def test_get_config_singleton(self):
        """Test config singleton"""
        os.environ["NVIDIA_API_KEY"] = "test-key"
        
        # Reset to ensure clean state
        reset_config()
        
        config1 = get_config()
        config2 = get_config()
        
        # Should be the same instance
        assert config1 is config2
        
        # Reset for other tests
        reset_config()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
