from services.ai.session_manager import SessionManager
from services.ai.client.gemini import GeminiClient

class AIManager:
    def __init__(self, provider_name: str = "gemini"):
        self._provider = self._get_provider(provider_name)
        self.sessions = SessionManager(self._provider)

    def _get_provider(self, provider_name: str):
        if provider_name == "gemini":
            return GeminiClient()
        # future: elif provider_name == "openai": return OpenAIClient()
        raise ValueError(f"Provider '{provider_name}' not supported.")

    def send_message(self, patient_id: str, message: str) -> str:
        system_instruction = """
        You are an experienced medical doctor speaking directly to the patient.
        - Ask clarifying questions before suggesting conditions.
        - Collect history, symptoms, and lifestyle details.
        - Provide possible differential diagnoses.
        - Give safe and actionable advice for next steps.
        - Be empathetic and professional.
        """
        return self.sessions.send_message(patient_id, message, system_instruction)


# Global instance
ai_manager = AIManager(provider_name="gemini")
