from services.ai.session_manager import SessionManager
from services.ai.client.gemini import GeminiClient

class AIManager:
    def __init__(self, provider_name: str = "gemini"):
        # The system instruction is now a core part of the AIManager's configuration.
        self.system_instruction = """
You are "TebNegar AI", a professional AI medical assistant.
Your primary goal is to help the user understand their symptoms and guide them toward appropriate next steps.
You are speaking directly to a patient who is concerned about their health like an expert doctor.

Your operational protocol is as follows:
1.  **Acknowledge**: Start by acknowledging the user's concern.
2.  **Ask Clarifying Questions**: Before suggesting any possibilities, ask targeted questions to better understand the symptoms (e.g., "How long have you had this headache?", "Can you describe the pain? Is it sharp or dull?", "Are there any other symptoms like fever or nausea?").
3.  **Gather Context**: Inquire about relevant medical history, lifestyle, and recent activities if applicable.
4.  **Provide Differential Possibilities**: Based on the information, you can suggest a few *possible* conditions in a careful and non-alarming way. Use phrases like "Symptoms like these could be related to several things, such as..." or "One possibility to consider is...".
6.  **Give Safe, Actionable Advice**: Your primary advice should almost always be to consult a healthcare professional. You can also suggest safe, general home care tips (e.g., "resting and staying hydrated can be helpful for many common illnesses").
7.  **Maintain Persona**: Your tone should be calm, reassuring, and professional throughout the conversation.
"""
        self._provider = self._get_provider(provider_name, self.system_instruction)
        self.sessions = SessionManager(self._provider)

    def _get_provider(self, provider_name: str, system_instruction: str):
        """Factory for creating a configured AI provider."""
        if provider_name == "gemini":
            # Pass the instruction during client creation.
            return GeminiClient(system_instruction=system_instruction)
        # future: elif provider_name == "openai": return OpenAIClient(system_instruction)
        raise ValueError(f"Provider '{provider_name}' not supported.")

    def send_message(self, patient_id: str, message: str) -> str:
        """
        Handles sending a message to the session manager.
        It no longer needs to pass the system instruction.
        """
        return self.sessions.send_message(patient_id, message)


    def generate_title(self, patient_id: str) -> str:
        """
        Generates a title by sending a hidden prompt to the active chat session
        and then removing the interaction from the history.

        Args:
            patient_id: The conversation_id to identify the active chat session.

        Returns:
            A generated title string, or a fallback title if an error occurs.
        """

        # 1. Get the current, active chat session for the user
        chat_session = self.sessions.get_or_create_session(patient_id=patient_id)
        
        # If the conversation has just started, there's no context for a title
        if not chat_session.history:
            return "New Conversation"

        # 2. Define the "hidden" prompt that will be temporarily added
        prompt = """
        [SYSTEM PROMPT]: Based on our conversation so far, what is a concise, 
        5-word-maximum title for this chat? Respond with only the title and nothing else.
        """

        try:
            # 3. Send the message. This WILL add the prompt and response to the session's history.
            response = chat_session.send_message(prompt)
            
            # 4. CRITICAL STEP: Clean up the history.
            #    We are removing the last two entries:
            #    - The system prompt we just sent.
            #    - The AI's title response.
            #    This ensures the main conversation is not polluted.
            if len(chat_session.history) >= 2:
                chat_session.history = chat_session.history[:-2]

            # 5. Clean and return the title
            generated_title = response.text.strip().strip('"')
            return generated_title

        except Exception as e:
            # If anything goes wrong, log it and return a safe default
            print(f"Error generating title for session {patient_id}: {e}")
            return "New Conversation"

# Global instance
ai_manager = AIManager(provider_name="gemini")