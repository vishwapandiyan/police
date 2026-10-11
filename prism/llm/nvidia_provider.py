"""
NVIDIA API Provider

LLM provider implementation using NVIDIA API Catalog/NIM endpoints.
Uses OpenAI client library as NVIDIA API is OpenAI-compatible.
"""

import time
import json
import logging
from typing import Optional, Dict, Any
try:
    from openai import OpenAI
except ImportError:  # optional dependency; only needed for live NVIDIA calls
    OpenAI = None  # type: ignore[assignment]

from .base import BaseLLMProvider, LLMResponse, LLMError
from ..config import NVIDIAConfig

logger = logging.getLogger(__name__)


class NVIDIAProvider(BaseLLMProvider):
    """
    NVIDIA API provider implementation using OpenAI client.
    
    Uses NVIDIA API Catalog endpoints with OpenAI-compatible interface.
    Supports models like nvidia/nemotron-parse-2.0, etc.
    """
    
    def __init__(self, config: Optional[NVIDIAConfig] = None):
        """
        Initialize NVIDIA provider.
        
        Args:
            config: NVIDIA configuration. If None, loads from environment.
        """
        from ..config import get_config
        
        if config is None:
            config = get_config().nvidia
        
        self.config = config
        if OpenAI is None:
            raise ImportError("The 'openai' package is required for NVIDIAProvider (pip install openai)")
        self.client = OpenAI(
            base_url=self.config.base_url,
            api_key=self.config.api_key,
            timeout=self.config.timeout_seconds,
            max_retries=self.config.max_retries
        )
        
        logger.info(f"Initialized NVIDIA provider with model: {self.config.model_id}")
    
    def generate(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate response using NVIDIA API.
        
        Args:
            prompt: Input prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters (top_p, frequency_penalty, etc.)
            
        Returns:
            LLMResponse object
            
        Raises:
            LLMError: If API call fails
        """
        start_time = time.time()
        
        try:
            # Call NVIDIA API using OpenAI client
            completion = self.client.chat.completions.create(
                model=self.config.model_id,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature if temperature is not None else self.config.temperature,
                max_tokens=max_tokens if max_tokens is not None else self.config.max_tokens,
                top_p=kwargs.get("top_p", 1),
                stream=False
            )
            
            # Extract response
            content = completion.choices[0].message.content
            response_time_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=content,
                model=completion.model,
                tokens_used=completion.usage.total_tokens if completion.usage else None,
                finish_reason=completion.choices[0].finish_reason,
                response_time_ms=response_time_ms,
                metadata={
                    "usage": {
                        "prompt_tokens": completion.usage.prompt_tokens if completion.usage else 0,
                        "completion_tokens": completion.usage.completion_tokens if completion.usage else 0,
                        "total_tokens": completion.usage.total_tokens if completion.usage else 0
                    },
                    "response_id": completion.id,
                    "created": completion.created
                }
            )
            
        except Exception as e:
            error_msg = str(e)
            error_type = "unknown"
            
            if "timeout" in error_msg.lower():
                error_type = "timeout"
            elif "connection" in error_msg.lower():
                error_type = "connection_error"
            elif "401" in error_msg or "unauthorized" in error_msg.lower():
                error_type = "auth_error"
            elif "404" in error_msg:
                error_type = "model_not_found"
            elif "410" in error_msg:
                error_type = "model_deprecated"
            
            raise LLMError(
                f"NVIDIA API error: {error_msg}",
                error_type=error_type,
                original_error=e
            )
    
    def generate_json(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate JSON response from NVIDIA API.
        
        Args:
            prompt: Prompt requesting JSON output
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            **kwargs: Additional parameters
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            LLMError: If generation or JSON parsing fails
        """
        # Enhance prompt to request JSON
        if "json" not in prompt.lower() and "{" not in prompt:
            enhanced_prompt = f"{prompt}\n\nReturn your response as valid JSON."
        else:
            enhanced_prompt = prompt
        
        # Generate response
        response = self.generate(
            enhanced_prompt,
            temperature=temperature if temperature is not None else 0.1,  # Lower temp for JSON
            max_tokens=max_tokens,
            **kwargs
        )
        
        # Parse JSON from response
        try:
            # Try to find JSON in response
            content = response.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            
            if content.endswith("```"):
                content = content[:-3]
            
            content = content.strip()
            
            # Find JSON object
            start_idx = content.find("{")
            end_idx = content.rfind("}") + 1
            
            if start_idx == -1 or end_idx == 0:
                # Try array format
                start_idx = content.find("[")
                end_idx = content.rfind("]") + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Try parsing the whole content
                return json.loads(content)
                
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON from LLM response: {e}")
            logger.debug(f"Response content: {response.content[:500]}")
            raise LLMError(
                f"LLM did not return valid JSON: {str(e)}",
                error_type="json_parse_error",
                original_error=e
            )
    
    def check_health(self) -> bool:
        """
        Check if NVIDIA API is available.
        
        Returns:
            True if API is reachable and responding, False otherwise
        """
        try:
            # Simple test with minimal tokens
            response = self.generate(
                "Respond with 'OK'",
                temperature=0.0,
                max_tokens=10
            )
            return len(response.content) > 0
        except LLMError:
            return False
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def get_model_name(self) -> str:
        """Get the NVIDIA model name"""
        return self.config.model_id
    
    def supports_streaming(self) -> bool:
        """NVIDIA API supports streaming"""
        return True
    
    def get_context_length(self) -> int:
        """Get context length (model-specific)"""
        # Context lengths for common NVIDIA models
        context_lengths = {
            "nvidia/nemotron-parse-2.0": 4096,
            "meta/llama-3.1-70b-instruct": 128000,
            "meta/llama-3.1-8b-instruct": 128000,
            "mistralai/mixtral-8x7b-instruct-v0.1": 32768,
            "mistralai/mistral-7b-instruct-v0.3": 32768,
        }
        
        return context_lengths.get(self.config.model_id, 4096)
