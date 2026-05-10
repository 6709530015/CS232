from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import database
from app.core import crud
from app.schemas import schemas
from app.api.v1.auth import get_current_user
from app.model import models

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.User)
def read_user_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.update_user(db, user=current_user, user_update=user_update)
