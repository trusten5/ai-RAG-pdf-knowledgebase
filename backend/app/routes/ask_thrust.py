# app/routes/ask_thrust.py

from fastapi import APIRouter, Body
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.llm import Summarizer
from app.utils.embed import get_embedding  # <-- your embedding utility
from supabase import create_client
import os
import re

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class AskThrustRequest(BaseModel):
    project_id: str
    message: str
    history: List[Dict[str, Any]] = []

@router.post("/ask_thrust/")
async def ask_thrust(request: AskThrustRequest):
    # 1. Get query embedding
    try:
        query_embedding = get_embedding(request.message)
    except Exception as e:
        return {"response": f"Embedding error: {str(e)}", "citations": []}

    # 2. Vector search: retrieve top 5 most relevant briefs for project
    # Note: 'embedding' must be passed as a list of floats for Supabase RPC
    rpc_args = {
        "query_embedding": query_embedding,
        "project_id": request.project_id,
        "top_n": 5,
    }
    match_resp = supabase.rpc("match_briefs_by_embedding", rpc_args).execute()
    briefs = match_resp.data if hasattr(match_resp, "data") else match_resp.get("data", [])

    if not briefs:
        return {"response": "No relevant knowledgebase data found for this project.", "citations": []}

    # 3. Build context for LLM using top matches
    context_sections = []
    id_lookup = {}
    for brief in briefs:
        section = []
        title = brief.get("title", "")
        brief_id = str(brief.get("id", ""))
        if title:
            section.append(f"# {title}")
        if brief.get("executive_summary"):
            section.append("## Executive Summary\n" + brief["executive_summary"])
        if brief.get("summary"):
            section.append("## Summary\n" + brief["summary"])
        if brief.get("slide_bullets"):
            section.append("## Slide Bullets\n" + brief["slide_bullets"])
        context_sections.append("\n".join(section))
        if title:
            id_lookup[title] = brief_id  # for citation linking

    context_text = "\n\n".join(context_sections)

    # 4. Run LLM on the matched context
    summarizer = Summarizer()
    llm_response = summarizer.ask_thrust(context_text, request.message, request.history)

    # 5. Extract citations (pattern: [CITATION: ...]) with linking info
    citation_pattern = r"\[CITATION:\s*([^\]]+)\]"
    raw_citations = re.findall(citation_pattern, llm_response)
    citations = []
    for c in raw_citations:
        label = c.strip()
        brief_id = id_lookup.get(label)
        if brief_id:
            citations.append({"label": label, "brief_id": brief_id})
        else:
            citations.append({"label": label, "brief_id": None})

    return {
        "response": llm_response,
        "citations": citations,
    }
