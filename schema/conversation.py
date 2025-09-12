# schema/conversation.py

import uuid
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from .message import MessageInDB


# ---------------------------------------------------------------------------
# Schemas for Creating and Updating Data (Input)
# ---------------------------------------------------------------------------

class ConversationCreate(BaseModel):
    """
    Schema for creating a new conversation.
    Only the session_id is required from the client.
    Only the client SHOULD fill this if they're not logged in and anonymous.
    Otherwise they should leave it empty and just send the JWT token in the header of their request.
    """
    session_id: uuid.UUID | None = None


class ConversationCreateInternal(BaseModel):
    """
    Schema for creating a new conversation for use in code, not APIs.
    """
    session_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None

class ConversationUpdate(BaseModel):
    """
    Schema for updating a conversation's title.
    This is the only field that should be mutable by a user.
    """
    title: str = Field(
        ..., 
        min_length=1, 
        max_length=100, 
        description="The new title for the conversation."
    )


# ---------------------------------------------------------------------------
# Schemas for Reading Data from the Database (Output)
# ---------------------------------------------------------------------------

class ConversationHistory(BaseModel):
    """
    A lightweight schema for displaying a list of conversations in the sidebar.
    """
    id: uuid.UUID
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationInDB(BaseModel):
    """
    The full conversation schema, including all associated messages.
    Used when a user clicks on a conversation to view its contents.
    """
    id: uuid.UUID
    session_id: uuid.UUID
    title: str
    created_at: datetime
    messages: List[MessageInDB] = []

    class Config:
        from_attributes = True

class ConversationTitle(BaseModel):
    title: str 