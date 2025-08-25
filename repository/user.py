from sqlalchemy.orm import Session
from db.model.user import User
from schema.user import UserCreate
from .base import CRUDBase

class CRUDUser(CRUDBase[User, UserCreate, UserCreate]):
    def get_by_google_id(self, db: Session, *, google_id: str) -> User | None:
        return db.query(User).filter(User.google_id == google_id).first()

    def get_by_email(self, db: Session, *, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

user = CRUDUser(User)
