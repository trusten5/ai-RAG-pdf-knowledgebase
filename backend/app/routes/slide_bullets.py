# app/routes/slide_bullets.py

from fastapi import APIRouter, Body
from app.utils.embed import get_embedding
from app.services.llm import Summarizer
import os
import logging
from supabase import create_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

router = APIRouter()

@router.post("/generate_slide_bullets/")
def generate_slide_bullets(payload: dict = Body(...)):
    brief_id = payload.get("brief_id")
    summary = payload.get("summary")
    user_prompt = payload.get("prompt", "")

    if not brief_id or not summary:
        logger.warning("Slide bullets request missing brief_id or summary.")
        return {"error": "Missing brief_id or summary"}

    summarizer = Summarizer()
    logger.info(f"Generating slide bullets for brief {brief_id} with prompt: {user_prompt!r}")
    bullets = summarizer.generate_slide_bullets(summary, user_prompt)
    logger.info(f"Generated Slide Bullets:\n{bullets}\n")

    # Update the slide_bullets field in Supabase
    supabase.table("briefs").update({"slide_bullets": bullets}).eq("id", brief_id).execute()
    # === NEW: Fetch all text for embedding, update embedding
    brief_resp = supabase.table("briefs").select("summary,executive_summary,slide_bullets").eq("id", brief_id).single().execute()
    brief = brief_resp.data if hasattr(brief_resp, "data") else brief_resp.get("data", {})
    embedding_text = (brief.get("summary") or "") + "\n" + (brief.get("executive_summary") or "") + "\n" + (bullets or "")
    embedding = get_embedding(embedding_text)
    supabase.table("briefs").update({"embedding": embedding}).eq("id", brief_id).execute()
    # ===

    return {"bullets_markdown": bullets}

@router.post("/chat_on_slide_bullets/")
def chat_on_slide_bullets(payload: dict = Body(...)):
    slide_bullets = payload.get("slide_bullets")
    user_message = payload.get("message")
    history = payload.get("history", [])
    if not slide_bullets or not user_message:
        logger.warning("Missing slide bullets or user message in chat_on_slide_bullets.")
        return {"error": "Missing required fields"}
    summarizer = Summarizer()
    logger.info(f"User message on slide bullets: {user_message}")
    response = summarizer.chat_on_slide_bullets(slide_bullets, user_message, history)
    logger.info(f"LLM response: {response}")
    return {"response": response}