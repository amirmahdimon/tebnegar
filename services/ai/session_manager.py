from threading import Lock

class SessionManager:
    def __init__(self, provider):
        self.provider = provider
        self.sessions = {}   # patient_id → session object
        self.lock = Lock()

    def get_or_create_session(self, patient_id: str, system_instruction: str = ""):
        with self.lock:
            if patient_id not in self.sessions:
                self.sessions[patient_id] = self.provider.start_session(system_instruction)
            return self.sessions[patient_id]

    def send_message(self, patient_id: str, message: str, system_instruction: str = "") -> str:
        session = self.get_or_create_session(patient_id, system_instruction)
        return self.provider.send_message(session, message)
