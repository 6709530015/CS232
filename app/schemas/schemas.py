from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., max_length=72)

class User(UserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None
    is_completed: bool = False

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: UUID
    owner_id: UUID

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str | None = None