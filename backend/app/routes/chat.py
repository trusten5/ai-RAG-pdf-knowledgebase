from fastapi import APIRouter, Body
from app.utils.embed import get_embedding
from app.services.llm import Summarizer
from app.models import Brief
from app.db import SessionLocal
import logging, os

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat/")
def chat_with_ai(payload: dict = Body(...)):
    try:
        user_message = payload.get("message")
        summary = payload.get("summary")
        history = payload.get("history", [])
        summary_id = payload.get("summary_id")  # brief PK

        if not user_message:
            logger.error("No user message received.")
            return {"error": "No message provided."}

        summarizer = Summarizer()
        logger.info(f"Received chat: {user_message}")
        logger.info(f"Summary excerpt: {summary[:200] if summary else 'None'}")
        logger.info(f"History: {history}")

        response = summarizer.chat_on_summary(summary, user_message, history)
        logger.info(f"AI response: {response[:200]}")

        # Store the edit as a new revision if it's a Markdown section (edit)
        if response and response.strip().startswith("##") and summary_id:
            db = SessionLocal()
            revision = Brief(
                title=None,
                prompt=f"AI edit: {user_message}",
                status="edit",
                summary=response,
                parent_id=summary_id,
            )
            db.add(revision)
            db.commit()
            db.close()
            logger.info(f"Stored new revision for summary_id {summary_id}")

            # === NEW: Also update embedding in Supabase for the brief
            from supabase import create_client
            SUPABASE_URL = os.environ.get("SUPABASE_URL")
            SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
            supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            # Fetch exec_summary/slide_bullets
            brief_resp = supabase.table("briefs").select("executive_summary,slide_bullets").eq("id", summary_id).single().execute()
            brief = brief_resp.data if hasattr(brief_resp, "data") else brief_resp.get("data", {})
            embedding_text = (response or "") + "\n" + (brief.get("executive_summary") or "") + "\n" + (brief.get("slide_bullets") or "")
            embedding = get_embedding(embedding_text)
            supabase.table("briefs").update({"embedding": embedding, "summary": response}).eq("id", summary_id).execute()
            # ===

        return {"message": response}

    except Exception as e:
        logger.error(f"Error in /chat/: {e}", exc_info=True)
        return {"error": "Sorry, there was an error with the AI assistant."}
