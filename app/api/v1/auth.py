from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.model import models
from app.database import database
from passlib.context import CryptContext

from app.schemas import schemas
import os
from dotenv import load_dotenv

load_dotenv()

# Config for JWT and password hashing
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)) 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# this is very password hashing. the design is very human. it will hash the password using bcrypt algorithm. this is a one way function, you can't get the original password from the hashed password. this is why we need to verify password function to check if the plain password matches the hashed password.
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# this is the function to create access token. it will take a dictionary of data, add an expiration time to it, and then encode it using the SECRET_KEY and ALGORITHM. the resulting token can be used for authentication in our API.
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# This is check for the token i was yapping about
# has to use docGPT to do this part. so becareful with it. it fragile and can break easily. 
# this function is used to authenticate the user by checking the username and password. it will query the database to get the user object, then verify the password using the verify_password function. if the authentication is successful, it will return the user object, otherwise it will return None.
def get_current_user( db: Session = Depends(database.get_db),token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        # this is the exception that will be raised when the token is invalid or expired. 
        # it will return a 401 status code and a message saying "Could not validate credentials". 
        # it also includes a header that tells the client to use Bearer token for authentication.
        # tldr: this is the error message that will be returned when the token is invalid or expired.

        # these explaination comment were auto finished by copilot. i cant really speak coherently irl.
        status_code=status.HTTP_401_UNAUTHORIZED,
        # can change this one to be more descriptive 
        detail="Could not validate credentials",
        # touch this and ill skin you alive | cowsay this is the header that will be sent back to the client when the token is invalid or expired. it tells the client that it needs to authenticate using a Bearer token.
        headers={"WWW-Authenticate": "Bearer"},
    )
    try: # This is where we decode token that received from request, then get token data and check if user exists in database
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # this is where we setup query and execute it
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    return user
