from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    def get_assessment(self, symptoms: str) -> str:
        """
        Takes a string of symptoms and returns a preliminary assessment.
        """
        pass