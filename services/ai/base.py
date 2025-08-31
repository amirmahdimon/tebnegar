from abc import ABC, abstractmethod
from google.generativeai.generative_models import ChatSession

class AIProvider(ABC):
    """Abstract interface for all AI providers."""

    @abstractmethod
    def start_session(self) -> ChatSession:
        """Create a new session (chat). The system instruction is handled at initialization."""
        pass

    @abstractmethod
    def send_message(self, session, message: str) -> str:
        """Send a message to an existing session."""
        pass