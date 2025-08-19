# services/ai/base.py

from abc import ABC, abstractmethod

class AIProvider(ABC):
    """Abstract interface for all AI providers."""

    @abstractmethod
    def start_session(self):
        """Create a new session (chat). The system instruction is handled at initialization."""
        pass

    @abstractmethod
    def send_message(self, session, message: str) -> str:
        """Send a message to an existing session."""
        pass