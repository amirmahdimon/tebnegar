import google.generativeai as genai
from google.generativeai.generative_models import ChatSession

from config import SETTINGS  # Assuming your settings are in config.settings
from services.ai.base import AIProvider


class GeminiClient(AIProvider):
    def __init__(self, system_instruction: str):
        """
        Initializes the Gemini client with a system instruction that defines its behavior.
        """
        genai.configure(api_key=SETTINGS.GEMINI_API_KEY, transport="rest")  # type: ignore

        self.model = genai.GenerativeModel(SETTINGS.GEMINI_MODEL, system_instruction=system_instruction)  # type: ignore

    def start_session(self) -> ChatSession:
        """
        Starts a new chat session. The model already knows its system instruction.
        """
        # The history should start empty. The system instruction is handled by the model itself.
        return self.model.start_chat(history=[])

    def send_message(self, session, message: str) -> str:
        """
        Sends a message in an existing session.
        """
        try:
            response = session.send_message(message)
            return response.text
        except Exception as e:
            # Logging
            print(f"Error during Gemini API call: {e}")
            # Return a safe, generic error message to the user
            return "I'm sorry, but I encountered an error and can't continue this conversation. Please try again later."
