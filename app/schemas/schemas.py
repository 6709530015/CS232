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

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    is_completed: bool | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str | None = None


class UserSettingBase(BaseModel):
    theme: str = "light"
    notify_before_minutes: int = 60
    is_email_notify: bool = True

class UserSettingUpdate(UserSettingBase):
    theme: str | None = None
    notify_before_minutes: int | None = None
    is_email_notify: bool | None = None

class UserSetting(UserSettingBase):
    id: int
    user_id: UUID

    class Config:
        from_attributes = True

class Notification(BaseModel):
    task_id: UUID
    title: str
    description: str | None = None
    due_date: datetime
    message: str
    is_completed: bool

    class Config:
        from_attributes = True