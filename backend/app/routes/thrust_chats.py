# app/routes/thrust_chats.py

from fastapi import APIRouter, Query
from supabase import create_client
import os

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@router.get("/thrust_chats/")
async def get_chats(project_id: str = Query(...)):
    resp = supabase.table("thrust_chats").select("*").eq("project_id", project_id).order("created_at", desc=False).execute()
    data = resp.data if hasattr(resp, "data") else resp.get("data", [])
    return data
