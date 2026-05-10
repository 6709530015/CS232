import os
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.model import models
from app.api.v1 import auth, tasks, settings, users
from app.core import crud
from app.database import database
from app.schemas import schemas
from app.services.sns import subscribe_user_to_sns
from datetime import datetime, timezone, timedelta
from typing import List, Optional

app = FastAPI(title="Infinite Website")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

models.Base.metadata.create_all(bind=database.engine)

app.include_router(tasks.router)
app.include_router(settings.router)
app.include_router(users.router)

@app.get("/api")
def read_root():
    return {"message": "Welcome to Infinite Website API! 🚀"}

@app.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = crud.create_user(db=db, user=user)
    
    subscribe_user_to_sns(user.email)
    
    return new_user

@app.post("/token", response_model=schemas.Token)
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

@app.get("/notifications") 
def read_notifications(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings_data = crud.get_user_settings(db, user_id=current_user.user_id)
    days_to_notify = settings_data.reminder_days if settings_data else 1

    now = datetime.now(timezone.utc)
    notify_until = now + timedelta(days=days_to_notify)

    tasks_list = db.query(models.Task).filter(
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
        for task in tasks_list
    ]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIR = os.path.join(BASE_DIR, "front")

if os.path.exists(FRONTEND_DIR):
    @app.get("/app")
    def serve_frontend():
        from fastapi.responses import FileResponse
        return FileResponse(os.path.join(FRONTEND_DIR, "signup.html"))
    
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="front")
