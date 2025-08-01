# app/services/parser.py
import pdfplumber

def extract_text_from_pdf(path: str) -> str:
    full_text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
    return full_text.strip()
