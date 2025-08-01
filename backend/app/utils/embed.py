from openai import OpenAI
from app.config import OPENAI_API_KEY

EMBEDDING_MODEL = "text-embedding-3-small"
client = OpenAI(api_key=OPENAI_API_KEY)

def get_embedding(text: str, model=EMBEDDING_MODEL):
    # Use only the first 8191 tokens if needed (OpenAI max for Ada v2)
    resp = client.embeddings.create(input=text[:8191], model=model)
    return resp.data[0].embedding