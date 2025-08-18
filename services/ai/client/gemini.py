import google.generativeai as genai
from config import SETTINGS
from services.ai.base import AIProvider

class GeminiClient(AIProvider):
    def __init__(self):
        # Set transport to rest to use HTTP_PROXY variable to prevent 403
        genai.configure(api_key=SETTINGS.GOOGLE_API_KEY, transport="rest") # type: ignore
        self.model = genai.GenerativeModel('gemini-2.5-pro') # type: ignore

    def get_assessment(self, symptoms: str) -> str:
        prompt = f"""
        As an AI medical assistant for preliminary assessment, analyze the following symptoms: "{symptoms}".
        Provide a general, safe, and informative preliminary assessment.
        IMPORTANT: Start your response with a clear disclaimer that this is not a medical diagnosis and the user should consult a doctor.
        Do not provide a definitive diagnosis. Suggest potential areas of concern and recommend seeing a healthcare professional.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            # In a real app, you would log this error properly
            print(f"Error calling Gemini API: {e}")
            return f"Error: {e}"