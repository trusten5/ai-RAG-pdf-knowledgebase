# app/routes/summarize.py

from fastapi import APIRouter, Body
from app.services.parser import extract_text_from_pdf
from app.utils.chunker import chunk_text
from app.utils.embed import get_embedding
from app.services.llm import Summarizer
import os
import logging
import requests
import tempfile
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

@router.post("/summarize/")
def summarize(payload: dict = Body(...)):
    logger.info("=== /api/summarize/ endpoint HIT ===")
    logger.info(f"Payload received: {payload}")

    file_url = payload.get("file_url")
    user_prompt = payload.get("prompt", "")
    project_id = payload.get("project_id")
    user_id = payload.get("user_id")

    if not project_id or not user_id:
        logger.error("Missing user_id or project_id in payload")
        return {"error": "project_id and user_id are required."}

    summarizer = Summarizer()
    summary = ""
    exec_summary = ""
    chunks_used = 0
    time_estimate = None
    filename = None

    if file_url:
        logger.info(f"Downloading PDF from: {file_url}")
        resp = requests.get(file_url)
        if resp.status_code != 200:
            logger.error(f"Could not fetch PDF from storage: {file_url}")
            return {"error": "Could not fetch file from storage."}
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(resp.content)
            temp_path = tmp.name
        try:
            text = extract_text_from_pdf(temp_path)
        finally:
            os.remove(temp_path)
        filename = file_url.split("/")[-1]
        logger.info(f"Extracted text from uploaded PDF (size: {len(text)} chars)")
        chunks = chunk_text(text)
        n_chunks = len(chunks)
        logger.info(f"PDF parsed into {n_chunks} chunk(s)")

        avg_time_per_chunk = 10  # seconds
        time_estimate = n_chunks * avg_time_per_chunk

        chunk_summaries = []
        for idx, chunk in enumerate(chunks):
            chunk_summary = summarizer.summarize_chunk(chunk, user_instruction=user_prompt)
            logger.info(f"----- Chunk {idx + 1} Output -----\n{chunk_summary}\n")
            chunk_summaries.append(chunk_summary)

        if n_chunks <= 5:
            summary = "\n\n".join(chunk_summaries)
            exec_summary = summarizer.executive_summary(chunk_summaries, user_instruction=user_prompt)
        else:
            meta = summarizer.meta_summarize(chunk_summaries, user_instruction=user_prompt)
            summary = meta
            exec_summary = summarizer.executive_summary(meta, user_instruction=user_prompt)

        chunks_used = n_chunks

    elif user_prompt:
        summary = summarizer.summarize_chunk(user_prompt)
        exec_summary = summarizer.executive_summary(summary)
        chunks_used = 1
        time_estimate = 10
        logger.info(f"Prompt Summary Output: {summary}")

    else:
        logger.error("No file_url or prompt provided")
        return {"error": "Must provide either a file_url or a prompt."}

    # === NEW: Generate embedding for brief ===
    embedding_text = summary + "\n" + exec_summary
    embedding = get_embedding(embedding_text)
    # ===

    # --- Save to Supabase briefs table ---
    brief_data = {
        "project_id": project_id,
        "user_id": user_id,
        "title": filename or "New Brief",
        "summary": summary,
        "executive_summary": exec_summary,
        "embedding": embedding,
        "status": "done",
    }

    result = supabase.table("briefs").insert(brief_data).execute()
    logger.info(f"Inserted brief into Supabase: {result.data}")

    return {
        "summary_markdown": summary,
        "executive_summary": exec_summary,
        "chunks_used": chunks_used,
        "time_estimate": time_estimate,
        "supabase_row": result.data,
    }