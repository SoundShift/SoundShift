from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from .auth import spotify
from .gemini_client import get_recommendations
from .spotify_service import get_recent_tracks, get_user_profile
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SoundShift API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spotify.router, prefix="/auth/spotify", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Welcome to SoundShift API"}

@app.get("/recommendations")
async def get_personalized_recommendations(
    mood: str = None,
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Please log in")
        
    access_token = authorization.split(' ')[1]
    
    try:
        recent_tracks = await get_recent_tracks(access_token)
        user_profile = await get_user_profile(access_token)
        recommendations = await get_recommendations(user_profile['id'], recent_tracks, mood)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))