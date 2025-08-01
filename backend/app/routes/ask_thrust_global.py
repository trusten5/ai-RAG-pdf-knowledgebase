from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.llm import Summarizer
from app.utils.embed import get_embedding
from supabase import create_client
import os
import re

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class GlobalAskThrustRequest(BaseModel):
    user_id: str
    message: str
    history: List[Dict[str, Any]] = []

@router.post("/ask_thrust_global/")
async def ask_thrust_global(request: GlobalAskThrustRequest):
    try:
        query_embedding = get_embedding(request.message)
    except Exception as e:
        return {"response": f"Embedding error: {str(e)}", "citations": []}

    rpc_args = {
        "query_embedding": query_embedding,
        "target_user_id": request.user_id,
        "top_n": 7,
    }
    match_resp = supabase.rpc("match_briefs_by_user_embedding", rpc_args).execute()
    briefs = match_resp.data if hasattr(match_resp, "data") else match_resp.get("data", [])

    if not briefs:
        return {"response": "No relevant briefs found in your account.", "citations": []}

    context_sections = []
    citation_lookup = {}
    for brief in briefs:
        section = []
        title = brief.get("title", "")
        project_title = brief.get("project_title", "")
        brief_id = str(brief.get("id", ""))
        project_id = str(brief.get("project_id", ""))
        if title:
            section.append(f"# {title} (Project: {project_title})")
        if brief.get("executive_summary"):
            section.append("## Executive Summary\n" + brief["executive_summary"])
        if brief.get("summary"):
            section.append("## Summary\n" + brief["summary"])
        if brief.get("slide_bullets"):
            section.append("## Slide Bullets\n" + brief["slide_bullets"])
        context_sections.append("\n".join(section))
        if title and project_id:
            citation_lookup[f"{title}|||{project_id}"] = {"brief_id": brief_id, "project_id": project_id, "project_title": project_title}

    context_text = "\n\n".join(context_sections)

    # Use the new (but actually identical) global method
    summarizer = Summarizer()
    llm_response = summarizer.ask_thrust_global(context_text, request.message, request.history)

    citation_pattern = r"\[CITATION:\s*([^\]]+)\]"
    raw_citations = re.findall(citation_pattern, llm_response)
    citations = []
    for c in raw_citations:
        label = c.strip()
        # Attempt to match title/project in lookup
        for key, val in citation_lookup.items():
            if label in key:
                citations.append({
                    "label": label,
                    "brief_id": val["brief_id"],
                    "project_id": val["project_id"],
                    "project_title": val["project_title"],
                })
                break
        else:
            citations.append({"label": label, "brief_id": None, "project_id": None, "project_title": None})

    return {
        "response": llm_response,
        "citations": citations,
    }
