# app/routes/upload.py
# No longer in use, replaced by supabase
from fastapi import APIRouter, File, UploadFile, HTTPException
import os
import shutil

router = APIRouter()
UPLOAD_DIR = "app/uploads"
ALLOWED_EXTENSIONS = {".pdf"}

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    file_path = os.path.join(UPLOAD_DIR, file.filename.replace("/", "_"))
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "path": file_path}
