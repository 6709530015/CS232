from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.model import models
from passlib.context import CryptContext
import uuid

from app.schemas import schemas

# this file truly exsist to be database query wrapper
# why hash password? i mean we could just keep plain text. that will help the IDF agent to access to yall data easier. making big yahu not to sit on his stinky letter seat for so long that his crusty left balls to not grow mold or something.
# but in all seriousness, hashing password is a security measure to protect user data in case of a data breach.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# async = tell interpreter that this function will be asynchronous, meaning it can be paused and resumed later, 
# allowing other code to run in the meantime/ pair with await to execute async code

# get user by email, quary from database to check if user exist, this is used for login and registration to check if email is already registered
async def get_user_by_email(db: AsyncSession, email: str):
    query = select(models.User).where(models.User.email == email)
    result = await db.execute(query)
    return result.scalar_one_or_none()

# assign hashed password to user, then add user to database, this is used for registration
async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# get user by id, this is used for authentication to get user data from database using user id from token
async def get_user(db: AsyncSession, user_id: uuid.UUID):
    query = select(models.User).where(models.User.id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

# create task for user, this is used for creating task, we need to associate task with user id to know which task belong to which user
async def create_user_task(db: AsyncSession, task: schemas.TaskCreate, user_id: uuid.UUID):
    db_task = models.Task(**task.model_dump(), owner_id=user_id)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task
