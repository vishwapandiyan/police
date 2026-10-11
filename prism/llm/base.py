"""
Base LLM Provider Interface

Abstract base class for LLM providers to ensure consistent interface
across different providers (NVIDIA, mock, etc.)
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime


@dataclass
class LLMResponse:
    """Structured response from LLM"""
    content: str
    model: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    response_time_ms: Optional[float] = None
    timestamp: datetime = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.metadata is None:
            self.metadata = {}


class LLMError(Exception):
    """Base exception for LLM provider errors"""
    def __init__(self, message: str, error_type: str = "unknown", original_error: Optional[Exception] = None):
        super().__init__(message)
        self.error_type = error_type
        self.original_error = original_error


class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    
    All providers must implement these methods to ensure consistent behavior
    across the PRISM system.
    """
    
    @abstractmethod
    def generate(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: The input prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Returns:
            LLMResponse object
            
        Raises:
            LLMError: If generation fails
        """
        pass
    
    @abstractmethod
    def generate_json(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a JSON response from the LLM.
        
        Args:
            prompt: The input prompt requesting JSON output
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            LLMError: If generation or JSON parsing fails
        """
        pass
    
    @abstractmethod
    def check_health(self) -> bool:
        """
        Check if the LLM provider is available and healthy.
        
        Returns:
            True if provider is available, False otherwise
        """
        pass
    
    def get_model_name(self) -> str:
        """Get the model name/ID being used"""
        return "unknown"
    
    def supports_streaming(self) -> bool:
        """Check if provider supports streaming responses"""
        return False
    
    def get_context_length(self) -> int:
        """Get maximum context length in tokens"""
        return 4096  # Default conservative estimate
