from fastapi import HTTPException
from datetime import datetime, timedelta
import jwt
from typing import Dict

SECRET_KEY = "your-secret-key-here"  # Move this to .env in production
ALGORITHM = "HS256"

def create_session_token(data: Dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_session_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token") 