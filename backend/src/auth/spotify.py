from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
import os
from typing import Optional
import secrets
import base64
import httpx
from pydantic import BaseModel
from .session import create_session_token
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:3000/callback"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"

# Debug .env variables
print(f"Client ID loaded: {CLIENT_ID is not None}")
print(f"Client Secret loaded: {CLIENT_SECRET is not None}")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None
    scope: str

@router.get("/login")
async def login():
    state = secrets.token_urlsafe(16)
    
    scope = " ".join([
        "user-read-private",
        "user-read-email",
        "user-read-playback-state",
        "user-read-currently-playing",
        "user-top-read",
        "playlist-read-private",
        "playlist-read-collaborative"
    ])
    
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "scope": scope,
        "redirect_uri": REDIRECT_URI,
        "state": state
    }

    return RedirectResponse(f"{AUTH_URL}?{urlencode(params)}")

@router.get("/callback")
async def callback(code: str, state: Optional[str] = None):
    auth_header = base64.b64encode(
        f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
    ).decode()
    
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(TOKEN_URL, headers=headers, data=data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Token exchange failed")
        
        tokens = response.json()
        session_token = create_session_token({"spotify_id": tokens.get("id")})
        
        response = JSONResponse(content=tokens)
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            max_age=3600 * 24,
            secure=True,
            samesite="lax"
        )
        
        return response

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    auth_header = base64.b64encode(
        f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
    ).decode()
    
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(TOKEN_URL, headers=headers, data=data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Token refresh failed")
        
        return TokenResponse(**response.json()) 