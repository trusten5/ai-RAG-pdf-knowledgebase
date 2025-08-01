# main.py
from fastapi import FastAPI
from app.routes import summarize, upload, chat, brief, slide_bullets, ask_thrust, ask_thrust_global, thrust_chats
from fastapi.middleware.cors import CORSMiddleware
from app.models import Base
from app.db import engine


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(upload.router, prefix="/api")
app.include_router(summarize.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(brief.router, prefix="/api")
app.include_router(slide_bullets.router, prefix="/api")
app.include_router(ask_thrust.router, prefix="/api")
app.include_router(ask_thrust_global.router, prefix="/api")
app.include_router(thrust_chats.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
