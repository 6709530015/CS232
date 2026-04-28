from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None 

class UserCreate(UserBase):
    password: str = Field(..., max_length=72)

class User(UserBase):
    user_id: int  
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    status: str = "pending" 

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None

class Task(TaskBase):
    task_id: int    
    user_id: int    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SETTINGS SCHEMAS ---
class UserSettingBase(BaseModel):
    theme: str = "light"
    reminder_days: int = 1 
    notification_enabled: bool = True 

class UserSettingUpdate(BaseModel):
    theme: Optional[str] = None
    reminder_days: Optional[int] = None
    notification_enabled: Optional[bool] = None

class UserSetting(UserSettingBase):
    setting_id: int 
    user_id: int   

    class Config:
        from_attributes = True

# --- AUTH & TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None 

# --- NOTIFICATION (ฟีเจอร์ใหม่) ---
class Notification(BaseModel):
    notification_id: int
    user_id: int
    task_id: int
    message: str
    notify_date: datetime
    is_read: bool
    is_sent: bool

    class Config:
        from_attributes = True