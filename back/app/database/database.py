import os
from dotenv import load_dotenv
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL must be set and configured for MySQL")

if not SQLALCHEMY_DATABASE_URL.startswith(("mysql+asyncmy", "mysql+aiomysql")):
    raise ValueError(
        f"Async MySQL URL required. Use mysql+asyncmy:// or mysql+aiomysql://, got: {SQLALCHEMY_DATABASE_URL}"
    )

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session