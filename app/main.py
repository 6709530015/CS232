from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.model import models
from app.api.v1 import auth
from app.core import crud
from app.database import database
from app.schemas import schemas

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
