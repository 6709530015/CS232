from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import database
from app.core import crud
from app.schemas import schemas
from app.api.v1.auth import get_current_user
from app.model import models

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/", response_model=schemas.UserSetting)
def get_my_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    settings = crud.get_user_settings(db, user_id=current_user.id)
    if not settings:
        return {"theme": "light", "notify_before_minutes": 60, "is_email_notify": True}
    return settings

@router.patch("/", response_model=schemas.UserSetting)
def update_my_settings(settings_in: schemas.UserSettingUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_user_settings(db, settings=settings_in, user_id=current_user.id)