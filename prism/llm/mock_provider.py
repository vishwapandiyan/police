"""
Mock LLM Provider

Provides deterministic responses for testing without requiring
actual API calls or credentials.
"""

import time
import json
from typing import Optional, Dict, Any

from .base import BaseLLMProvider, LLMResponse, LLMError


class MockLLMProvider(BaseLLMProvider):
    """
    Mock LLM provider for testing.
    
    Returns predefined or template-based responses without making
    actual API calls.
    """
    
    def __init__(self, responses: Optional[Dict[str, str]] = None):
        """
        Initialize mock provider.
        
        Args:
            responses: Optional dictionary mapping prompt patterns to responses
        """
        self.responses = responses or {}
        self.call_count = 0
        self.last_prompt = None
    
    def generate(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate mock response.
        
        Args:
            prompt: Input prompt
            temperature: Ignored
            max_tokens: Ignored
            **kwargs: Ignored
            
        Returns:
            LLMResponse with mock content
        """
        start_time = time.time()
        self.call_count += 1
        self.last_prompt = prompt
        
        # Find matching response
        content = self._get_response_for_prompt(prompt)
        
        response_time_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            content=content,
            model="mock-model",
            tokens_used=len(content.split()),
            finish_reason="stop",
            response_time_ms=response_time_ms,
            metadata={"call_count": self.call_count, "is_mock": True}
        )
    
    def generate_json(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate mock JSON response.
        
        Args:
            prompt: Input prompt
            temperature: Ignored
            max_tokens: Ignored
            **kwargs: Ignored
            
        Returns:
            Mock JSON dictionary
        """
        self.call_count += 1
        self.last_prompt = prompt
        
        # Check for predefined JSON responses
        for pattern, response in self.responses.items():
            if pattern.lower() in prompt.lower():
                if isinstance(response, dict):
                    return response
                elif isinstance(response, str):
                    try:
                        return json.loads(response)
                    except:
                        pass
        
        # Return template JSON based on prompt type
        if "proposal" in prompt.lower() and "dna" in prompt.lower():
            return self._mock_proposal_dna()
        elif "precedent" in prompt.lower() or "decision" in prompt.lower():
            return self._mock_precedent()
        elif "expand" in prompt.lower() and "query" in prompt.lower():
            return ["original query variation 1", "original query variation 2"]
        elif "decompose" in prompt.lower() or "sub-question" in prompt.lower():
            return ["sub-question 1", "sub-question 2"]
        else:
            return {"response": "Mock JSON response", "is_mock": True}
    
    def check_health(self) -> bool:
        """Mock provider is always healthy"""
        return True
    
    def get_model_name(self) -> str:
        """Return mock model name"""
        return "mock-model"
    
    def supports_streaming(self) -> bool:
        """Mock does not support streaming"""
        return False
    
    def get_context_length(self) -> int:
        """Return mock context length"""
        return 4096
    
    def _get_response_for_prompt(self, prompt: str) -> str:
        """Find appropriate mock response for prompt"""
        prompt_lower = prompt.lower()
        
        # Check predefined responses
        for pattern, response in self.responses.items():
            if pattern.lower() in prompt_lower:
                if isinstance(response, str):
                    return response
                else:
                    return json.dumps(response, indent=2)
        
        # Default responses based on prompt type
        if "proposal" in prompt_lower:
            return "This is a mock analysis of the proposal. The proposal appears to be requesting technology infrastructure for a police station."
        elif "precedent" in prompt_lower:
            return "Based on historical records, similar proposals have been approved in the past with an average budget of INR 5,00,000."
        elif "policy" in prompt_lower or "sop" in prompt_lower:
            return "Relevant policies include Police Procurement SOP 2023 and Government Order 1234/2023."
        elif "cost" in prompt_lower or "budget" in prompt_lower:
            return "The proposed cost appears to be within the typical range for similar projects."
        else:
            return "This is a mock response from the LLM provider."
    
    def _mock_proposal_dna(self) -> Dict[str, Any]:
        """Generate mock Proposal DNA"""
        return {
            "domain": "technology",
            "objective": "Deploy CCTV surveillance system",
            "location": "Puducherry Central Police Station",
            "police_station": "Central Station",
            "jurisdiction": "Puducherry District",
            "budget": 500000,
            "currency": "INR",
            "technology": "CCTV cameras, DVR, monitoring system",
            "scale": "20 cameras",
            "timeline": "3 months",
            "procurement_type": "tender"
        }
    
    def _mock_precedent(self) -> Dict[str, Any]:
        """Generate mock precedent"""
        return {
            "document_id": "mock-precedent-001",
            "title": "CCTV Installation - Sample Police Station",
            "similarity_score": 0.85,
            "decision_status": "approved",
            "budget": 450000,
            "jurisdiction": "Sample Region",
            "match_reason": "Similar technology deployment"
        }
