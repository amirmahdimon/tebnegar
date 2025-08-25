import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    google_id: str
    full_name: str | None = None
    picture_url: str | None = None

# Properties to receive via API on update
class UserUpdate(UserBase):
    full_name: str | None = None
    picture_url: str | None = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: uuid.UUID
    google_id: str
    full_name: str | None = None
    picture_url: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    pass
