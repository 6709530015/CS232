import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL must be set and configured for MySQL")
if not SQLALCHEMY_DATABASE_URL.startswith(("mysql", "mysql+")):
    raise ValueError(f"Only MySQL URLs supported, got: {SQLALCHEMY_DATABASE_URL}")

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Proper async context manager
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()  # ← await is required