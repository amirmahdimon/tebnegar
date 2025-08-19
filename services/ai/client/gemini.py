import google.generativeai as genai
from config import SETTINGS  # Assuming your settings are in config.settings
from services.ai.base import AIProvider

class GeminiClient(AIProvider):
    def __init__(self, system_instruction: str):
        """
        Initializes the Gemini client with a system instruction that defines its behavior.
        """
        genai.configure(api_key=SETTINGS.GEMINI_API_KEY,transport="rest") # type: ignore
        
        # The model is now initialized with the system instruction directly.
        # This is the correct way to set the AI's persona.
        # I've also updated the model to gemini-1.5-pro, which is highly recommended for this kind of chat application.
        self.model = genai.GenerativeModel("gemini-2.5-pro",system_instruction=system_instruction) # type: ignore

    def start_session(self):
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
            # Add logging here in a real application
            print(f"Error during Gemini API call: {e}")
            # Return a safe, generic error message to the user
            return "I'm sorry, but I encountered an error and can't continue this conversation. Please try again."