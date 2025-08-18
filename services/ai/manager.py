from .base import AIProvider
from .client import GeminiClient

class AIManager:
    def __init__(self, provider: str = "gemini"):
        self._provider = self._get_provider(provider)

    def _get_provider(self, provider_name: str) -> AIProvider:
        if provider_name == "gemini":
            return GeminiClient()
        # Add other providers here with "elif"
        # e.g., elif provider_name == "openai":
        #           return OpenAIClient()
        raise ValueError(f"Provider '{provider_name}' not supported.")

    def get_assessment(self, symptoms: str) -> str:
        return self._provider.get_assessment(symptoms)

# Global instance for the app
ai_manager = AIManager(provider="gemini")