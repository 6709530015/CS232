from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import database
from app.core import crud
from app.schemas import schemas
from app.api.v1.auth import get_current_user
from app.model import models
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_user_task(db=db, task=task, user_id=current_user.id)

@router.get("/", response_model=list[schemas.Task])
def read_tasks(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_tasks(db=db, user_id=current_user.id)

@router.patch("/{task_id}", response_model=schemas.Task)
def update_task(task_id: uuid.UUID, task_update: schemas.TaskUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_task = crud.update_task(db=db, task_id=task_id, task_update=task_update, user_id=current_user.id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found or you're not the owner")
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: uuid.UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_task(db=db, task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None