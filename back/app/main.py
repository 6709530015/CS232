import os
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.model import models
from app.api.v1 import auth
from app.core import crud
from app.database import database
from app.schemas import schemas
from datetime import datetime, timezone, timedelta
from typing import List, Optional

app = FastAPI(title="Infinite Website")

# --- CORS MIDDLEWARE (Must be before routes) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SETUP STATIC FILES ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to Infinite Website API! 🚀"}

# --- AUTH ROUTES ---
@app.post("/signup", response_model=schemas.User)
async def signup(user: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    db_user = await crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = await crud.create_user(db=db, user=user)
    
    # Trigger AWS SNS Subscription
    subscribe_user_to_sns(user.email)
    
    return new_user

@app.post("/login", response_model=schemas.Token)
async def login(db: AsyncSession = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = await crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = auth.create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": access_token, "token_type": "bearer"}

# --- TASK ROUTES ---
@app.get("/tasks", response_model=List[schemas.Task])
async def read_tasks(db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return await crud.get_user_tasks(db, user_id=current_user.user_id)

@app.post("/tasks", response_model=schemas.Task)
async def create_task(task: schemas.TaskCreate, db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return await crud.create_user_task(db=db, task=task, user_id=current_user.user_id)

@app.patch("/tasks/{task_id}", response_model=schemas.Task)
async def update_task(task_id: int, task_update: schemas.TaskUpdate, db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_task = await crud.update_task(db, task_id=task_id, task_update=task_update, user_id=current_user.user_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or permission denied")
    return db_task

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    success = await crud.delete_task(db, task_id=task_id, user_id=current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@app.post("/tasks/{task_id}/upload", response_model=schemas.Task)
async def upload_task_file(
    task_id: int, 
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = (await db.query(models.Task).filter(
        models.Task.task_id == task_id, 
        models.Task.user_id == current_user.user_id
    ).first())
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    file_extension = os.path.splitext(file.filename)[1]
    new_filename = f"task_{task_id}_{int(datetime.now().timestamp())}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    db_task.file_url = f"/uploads/{new_filename}"
    await db.commit()
    await db.refresh(db_task)
    return db_task

# --- SETTINGS ROUTES ---
@app.get("/settings", response_model=schemas.UserSetting)
async def read_settings(db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings = await crud.get_user_settings(db, user_id=current_user.user_id)
    if not settings:
        default_settings = schemas.UserSettingUpdate(theme="light", reminder_days=1)
        settings = await crud.update_user_settings(db, settings=default_settings, user_id=current_user.user_id)
    return settings

@app.patch("/settings", response_model=schemas.UserSetting)
async def update_settings(settings_in: schemas.UserSettingUpdate, db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return await crud.update_user_settings(db, settings=settings_in, user_id=current_user.user_id)

# --- NOTIFICATIONS ROUTE ---
@app.get("/notifications")
async def read_notifications(db: AsyncSession = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings = await crud.get_user_settings(db, user_id=current_user.user_id)
    days_to_notify = settings.reminder_days if settings else 1

    now = datetime.now(timezone.utc)
    notify_until = now + timedelta(days=days_to_notify)

    tasks = (await db.query(models.Task).filter(
        models.Task.user_id == current_user.user_id,
        models.Task.status == "pending",
        models.Task.due_date != None,
        models.Task.due_date <= notify_until
    ).all())

    return [
        {
            "notification_id": 0,
            "user_id": current_user.user_id,
            "task_id": task.task_id,
            "message": f"งาน '{task.title}' ใกล้ถึงกำหนดส่งแล้ว",
            "notify_date": task.due_date,
            "is_read": False,
            "is_sent": False
        }
        for task in tasks
    ]