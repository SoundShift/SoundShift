from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import spotify

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