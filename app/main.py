from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid
from app.model import models
from app.api.v1 import auth
from app.core import crud
from app.database import database
from app.schemas import schemas
from datetime import datetime, timezone, timedelta

app = FastAPI(title="Infinite Website")

# Create tables when the app starts 
models.Base.metadata.create_all(bind=database.engine)

# ROOT ROUTE
@app.get("/")
def read_root():
    return {"message": "Welcome to Infinite Website API! 🚀"}

# AUTH ROUTES
@app.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token)
def login(
    db: Session = Depends(database.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# TASK ROUTES
@app.get("/tasks", response_model=list[schemas.Task])
def read_tasks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_user_tasks(db, user_id=current_user.id)

@app.post("/tasks", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_user_task(db=db, task=task, user_id=current_user.id)

@app.patch("/tasks/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: uuid.UUID,
    task_update: schemas.TaskUpdate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = crud.update_task(db, task_id=task_id, task_update=task_update, user_id=current_user.id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or permission denied")
    return db_task

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    success = crud.delete_task(db, task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@app.get("/settings", response_model=schemas.UserSetting)
def read_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings = crud.get_user_settings(db, user_id=current_user.id)
    if not settings:
        from app.schemas.schemas import UserSettingUpdate
        default_settings = UserSettingUpdate(theme="light", notify_before_minutes=60)
        settings = crud.update_user_settings(db, settings=default_settings, user_id=current_user.id)
    return settings

@app.patch("/settings", response_model=schemas.UserSetting)
def update_settings(
    settings_in: schemas.UserSettingUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.update_user_settings(db, settings=settings_in, user_id=current_user.id)

@app.get("/notifications", response_model=list[schemas.Notification])
def read_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    settings = crud.get_user_settings(db, user_id=current_user.id)
    notify_minutes = settings.notify_before_minutes if settings else 60

    now = datetime.now(timezone.utc)
    notify_until = now + timedelta(minutes=notify_minutes)

    tasks = db.query(models.Task).filter(
        models.Task.owner_id == current_user.id,
        models.Task.is_completed == False,
        models.Task.due_date != None,
        models.Task.due_date <= notify_until
    ).all()

    return [
        {
            "task_id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date,
            "message": "ใกล้ถึงกำหนดส่งแล้ว",
            "is_completed": task.is_completed
        }
        for task in tasks
    ]