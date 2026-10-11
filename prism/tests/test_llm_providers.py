"""
Tests for LLM providers (Mock and NVIDIA)
"""

import pytest
import os

from prism.llm import MockLLMProvider, LLMError
from prism.llm.base import LLMResponse


class TestMockProvider:
    """Test Mock LLM Provider"""
    
    def test_mock_generate(self):
        """Test basic generation"""
        provider = MockLLMProvider()
        
        response = provider.generate("Test prompt")
        
        assert isinstance(response, LLMResponse)
        assert len(response.content) > 0
        assert response.model == "mock-model"
        assert response.metadata["is_mock"] == True
    
    def test_mock_with_custom_responses(self):
        """Test mock with predefined responses"""
        custom_responses = {
            "proposal": "This is a proposal response",
            "precedent": "This is a precedent response"
        }
        
        provider = MockLLMProvider(responses=custom_responses)
        
        response = provider.generate("Analyze this proposal")
        assert "proposal response" in response.content
    
    def test_mock_generate_json(self):
        """Test JSON generation"""
        provider = MockLLMProvider()
        
        result = provider.generate_json("Return proposal DNA as JSON")
        
        assert isinstance(result, dict)
        assert "domain" in result or "response" in result
    
    def test_mock_health_check(self):
        """Test health check always returns True"""
        provider = MockLLMProvider()
        assert provider.check_health() == True
    
    def test_mock_call_count(self):
        """Test call counting"""
        provider = MockLLMProvider()
        
        assert provider.call_count == 0
        
        provider.generate("test 1")
        assert provider.call_count == 1
        
        provider.generate("test 2")
        assert provider.call_count == 2
    
    def test_mock_last_prompt(self):
        """Test last prompt tracking"""
        provider = MockLLMProvider()
        
        provider.generate("First prompt")
        assert provider.last_prompt == "First prompt"
        
        provider.generate("Second prompt")
        assert provider.last_prompt == "Second prompt"


class TestNVIDIAProvider:
    """Test NVIDIA LLM Provider"""
    
    @pytest.fixture
    def skip_if_no_api_key(self):
        """Skip test if NVIDIA API key is not available"""
        if not os.getenv("NVIDIA_API_KEY") or os.getenv("NVIDIA_API_KEY") == "mock":
            pytest.skip("NVIDIA_API_KEY not available (use mock for testing)")
    
    def test_nvidia_provider_requires_api_key(self):
        """Test that NVIDIA provider requires API key"""
        # Temporarily clear environment
        old_key = os.getenv("NVIDIA_API_KEY")
        if old_key:
            del os.environ["NVIDIA_API_KEY"]
        
        try:
            from prism.llm import NVIDIAProvider
            from prism.config import NVIDIAConfig
            
            with pytest.raises(ValueError, match="NVIDIA_API_KEY is required"):
                config = NVIDIAConfig()
        finally:
            # Restore
            if old_key:
                os.environ["NVIDIA_API_KEY"] = old_key
    
    def test_nvidia_model_name(self, skip_if_no_api_key):
        """Test getting model name"""
        from prism.llm import NVIDIAProvider
        
        provider = NVIDIAProvider()
        model_name = provider.get_model_name()
        
        assert isinstance(model_name, str)
        assert len(model_name) > 0
    
    def test_nvidia_context_length(self, skip_if_no_api_key):
        """Test getting context length"""
        from prism.llm import NVIDIAProvider
        
        provider = NVIDIAProvider()
        context_length = provider.get_context_length()
        
        assert isinstance(context_length, int)
        assert context_length > 0
    
    # Real API tests (only run if API key is available)
    @pytest.mark.slow
    def test_nvidia_generate_real(self, skip_if_no_api_key):
        """Test actual generation (requires API key)"""
        from prism.llm import NVIDIAProvider
        
        provider = NVIDIAProvider()
        
        response = provider.generate(
            "Respond with exactly: 'Test successful'",
            temperature=0.0,
            max_tokens=10
        )
        
        assert isinstance(response, LLMResponse)
        assert len(response.content) > 0
        assert response.tokens_used is not None
    
    @pytest.mark.slow
    def test_nvidia_generate_json_real(self, skip_if_no_api_key):
        """Test JSON generation (requires API key)"""
        from prism.llm import NVIDIAProvider
        
        provider = NVIDIAProvider()
        
        result = provider.generate_json(
            'Return this exact JSON: {"status": "ok", "test": true}',
            temperature=0.0,
            max_tokens=50
        )
        
        assert isinstance(result, dict)
        # API might return slightly different format, just check it's valid JSON
    
    @pytest.mark.slow
    def test_nvidia_health_check_real(self, skip_if_no_api_key):
        """Test health check (requires API key)"""
        from prism.llm import NVIDIAProvider
        
        provider = NVIDIAProvider()
        health = provider.check_health()
        
        assert isinstance(health, bool)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
