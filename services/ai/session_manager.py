from threading import Lock

class SessionManager:
    def __init__(self, provider):
        self.provider = provider
        self.sessions = {}   # patient_id → session object
        self.lock = Lock()

    def get_or_create_session(self, patient_id: str):
        """
        Gets a session or creates one if it doesn't exist.
        It no longer needs the system_instruction.
        """
        with self.lock:
            if patient_id not in self.sessions:
                self.sessions[patient_id] = self.provider.start_session()
            return self.sessions[patient_id]

    def send_message(self, patient_id: str, message: str) -> str:
        """
        Sends a message to the correct session.
        """
        session = self.get_or_create_session(patient_id)
        return self.provider.send_message(session, message)