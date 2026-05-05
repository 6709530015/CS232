from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.model import models
from app.schemas import schemas
from app.api.v1 import auth


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(
        select(models.User).where(models.User.email == email)
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)

    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        name=user.name
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return db_user


async def get_user_tasks(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.Task).where(models.Task.user_id == user_id)
    )
    return result.scalars().all()


async def create_user_task(db: AsyncSession, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(
        **task.model_dump(),
        user_id=user_id
    )

    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)

    return db_task


async def update_task(
    db: AsyncSession,
    task_id: int,
    task_update: schemas.TaskUpdate,
    user_id: int
):
    result = await db.execute(
        select(models.Task).where(
            models.Task.task_id == task_id,
            models.Task.user_id == user_id
        )
    )
    db_task = result.scalar_one_or_none()

    if not db_task:
        return None

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    await db.commit()
    await db.refresh(db_task)

    return db_task


async def delete_task(db: AsyncSession, task_id: int, user_id: int):
    result = await db.execute(
        select(models.Task).where(
            models.Task.task_id == task_id,
            models.Task.user_id == user_id
        )
    )
    db_task = result.scalar_one_or_none()

    if db_task:
        await db.delete(db_task)
        await db.commit()
        return True

    return False


async def get_user_settings(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.UserSetting).where(models.UserSetting.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_user_settings(
    db: AsyncSession,
    settings: schemas.UserSettingUpdate,
    user_id: int
):
    result = await db.execute(
        select(models.UserSetting).where(models.UserSetting.user_id == user_id)
    )
    db_setting = result.scalar_one_or_none()

    if not db_setting:
        db_setting = models.UserSetting(
            **settings.model_dump(exclude_unset=True),
            user_id=user_id
        )
        db.add(db_setting)
    else:
        update_data = settings.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_setting, key, value)

    await db.commit()
    await db.refresh(db_setting)

    return db_setting