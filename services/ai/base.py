from abc import ABC, abstractmethod

class AIProvider(ABC):
    """Abstract interface for all AI providers."""

    @abstractmethod
    def start_session(self, system_instruction: str = ""):
        """Create a new session (chat) with optional system instruction."""
        pass

    @abstractmethod
    def send_message(self, session, message: str) -> str:
        """Send a message to an existing session."""
        pass