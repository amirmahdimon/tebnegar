import google.generativeai as genai
from config import SETTINGS
from services.ai.base import AIProvider

class GeminiClient(AIProvider):
    def __init__(self):
        genai.configure(api_key=SETTINGS.GEMINI_API_KEY, transport="rest") # type: ignore
        self.model = genai.GenerativeModel("gemini-2.5-pro") # type: ignore

    def start_session(self, system_instruction: str = ""):
        history = []
        if system_instruction:
            history.append({"role": "system", "parts": system_instruction})
        return self.model.start_chat(history=history)

    def send_message(self, session, message: str) -> str:
        response = session.send_message(message)
        return response.text