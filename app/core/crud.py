from sqlalchemy.orm import Session
from app.model import models
from app.schemas import schemas
from app.api.v1 import auth
import uuid


# this file truly exsist to be database query wrapper
# why hash password? i mean we could just keep plain text. that will help the IDF agent to access to yall data easier. making big yahu not to sit on his stinky letter seat for so long that his crusty left balls to not grow mold or something.
# but in all seriousness, hashing password is a security measure to protect user data in case of a data breach.

# no one talk about the first commit.
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # Use direct bcrypt hashing from auth module
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_tasks(db: Session, user_id: uuid.UUID):
    return db.query(models.Task).filter(models.Task.owner_id == user_id).all()

def create_user_task(db: Session, task: schemas.TaskCreate, user_id: uuid.UUID):
    db_task = models.Task(**task.model_dump(), owner_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: uuid.UUID, task_update: schemas.TaskUpdate, user_id: uuid.UUID):

    db_task = db.query(models.Task).filter(
        models.Task.id == task_id, 
        models.Task.owner_id == user_id
    ).first()
    
    if not db_task:
        return None
        
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: uuid.UUID, user_id: uuid.UUID):
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id, 
        models.Task.owner_id == user_id
    ).first()
    
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False

def get_user_settings(db: Session, user_id: uuid.UUID):
    return db.query(models.UserSetting).filter(models.UserSetting.user_id == user_id).first()

def update_user_settings(db: Session, settings: schemas.UserSettingUpdate, user_id: uuid.UUID):
    db_setting = db.query(models.UserSetting).filter(models.UserSetting.user_id == user_id).first()
    
    if not db_setting:
        db_setting = models.UserSetting(**settings.model_dump(), user_id=user_id)
        db.add(db_setting)
    else:
        update_data = settings.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_setting, key, value)
            
    db.commit()
    db.refresh(db_setting)
    return db_setting