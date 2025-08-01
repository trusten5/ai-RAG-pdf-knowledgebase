from fastapi import APIRouter, Path, Body, Query
from app.models import Brief
from app.db import SessionLocal
from app.utils.embed import get_embedding
import os
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


router = APIRouter()

@router.get("/briefs/")
def list_briefs(user_id: int = Query(None, description="User ID to filter by")):
    db = SessionLocal()
    query = db.query(Brief)
    if user_id is not None:
        query = query.filter(Brief.user_id == user_id)
    briefs = query.order_by(Brief.created_at.desc()).all()
    db.close()
    return [
        {
            "id": brief.id,
            "title": brief.title,
            "prompt": brief.prompt,
            "status": brief.status,
            "summary": brief.summary,
            "executive_summary": brief.executive_summary,
            "created_at": brief.created_at.isoformat(),
            "user_id": brief.user_id,
        }
        for brief in briefs
    ]

@router.patch("/brief/{id}")
def update_brief(id: int = Path(...), payload: dict = Body(...)):
    db = SessionLocal()
    brief = db.query(Brief).filter(Brief.id == id).first()
    if not brief:
        db.close()
        return {"error": "Brief not found"}

    updated = False
    summary_changed = False
    exec_changed = False
    if "summary" in payload:
        brief.summary = payload["summary"]
        updated = True
        summary_changed = True
    if "executive_summary" in payload:
        if hasattr(brief, "executive_summary"):
            brief.executive_summary = payload["executive_summary"]
            updated = True
            exec_changed = True

    if updated:
        db.commit()
        # Update embedding in Supabase
        brief_resp = supabase.table("briefs").select("summary,executive_summary,slide_bullets").eq("id", id).single().execute()
        b = brief_resp.data if hasattr(brief_resp, "data") else brief_resp.get("data", {})
        embedding_text = (b.get("summary") or "") + "\n" + (b.get("executive_summary") or "") + "\n" + (b.get("slide_bullets") or "")
        embedding = get_embedding(embedding_text)
        supabase.table("briefs").update({"embedding": embedding}).eq("id", id).execute()
    db.close()
    return {"success": updated}
