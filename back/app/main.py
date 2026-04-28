import os
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.model import models
from app.api.v1 import auth
from app.core import crud
from app.database import database
from app.schemas import schemas
from datetime import datetime, timezone, timedelta
from typing import List, Optional

app = FastAPI(title="Infinite Website")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "file://"],  # Allow local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SETUP STATIC FILES (สำหรับฟีเจอร์แนบงาน) ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

models.Base.metadata.create_all(bind=database.engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to Infinite Website API! 🚀"}

# --- AUTH ROUTES ---
@app.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token)
def login(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = auth.create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": access_token, "token_type": "bearer"}

# --- TASK ROUTES ---
@app.get("/tasks", response_model=List[schemas.Task])
def read_tasks(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_user_tasks(db, user_id=current_user.user_id)

@app.post("/tasks", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_user_task(db=db, task=task, user_id=current_user.user_id)

@app.patch("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_task = crud.update_task(db, task_id=task_id, task_update=task_update, user_id=current_user.user_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or permission denied")
    return db_task

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    success = crud.delete_task(db, task_id=task_id, user_id=current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@app.post("/tasks/{task_id}/upload", response_model=schemas.Task)
async def upload_task_file(
    task_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(
        models.Task.task_id == task_id, 
        models.Task.user_id == current_user.user_id
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    file_extension = os.path.splitext(file.filename)[1]
    new_filename = f"task_{task_id}_{int(datetime.now().timestamp())}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    db_task.file_url = f"/uploads/{new_filename}"
    db.commit()
    db.refresh(db_task)
    return db_task

# --- SETTINGS ROUTES ---
@app.get("/settings", response_model=schemas.UserSetting)
def read_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings = crud.get_user_settings(db, user_id=current_user.user_id)
    if not settings:
        default_settings = schemas.UserSettingUpdate(theme="light", reminder_days=1)
        settings = crud.update_user_settings(db, settings=default_settings, user_id=current_user.user_id)
    return settings

@app.patch("/settings", response_model=schemas.UserSetting)
def update_settings(settings_in: schemas.UserSettingUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.update_user_settings(db, settings=settings_in, user_id=current_user.user_id)

# --- NOTIFICATIONS ROUTE ---
@app.get("/notifications") 
def read_notifications(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings = crud.get_user_settings(db, user_id=current_user.user_id)
    days_to_notify = settings.reminder_days if settings else 1

    now = datetime.now(timezone.utc)
    notify_until = now + timedelta(days=days_to_notify)

    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.user_id,
        models.Task.status == "pending",
        models.Task.due_date != None,
        models.Task.due_date <= notify_until
    ).all()

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

# --- SERVE FRONTEND (MUST BE LAST!) ---
front_path = os.path.join(os.path.dirname(__file__), "..", "..", "front")
if os.path.exists(front_path):
    app.mount("/", StaticFiles(directory=front_path, html=True), name="frontend")