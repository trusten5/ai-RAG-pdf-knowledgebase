import tiktoken
import logging

# Set up logging for this module
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def is_english(text: str, ascii_ratio: float = 0.8) -> bool:
    if not text: return False
    return sum(1 for c in text if ord(c) < 128) / max(1, len(text)) > ascii_ratio

def chunk_text(text: str, max_tokens: int = 2000) -> list[str]:
    encoding = tiktoken.encoding_for_model("gpt-4")
    tokens = encoding.encode(text)
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        chunk_text = encoding.decode(chunk_tokens)
        num_chars = len(chunk_text)
        num_words = len(chunk_text.split())
        logging.info(f"Chunk {len(chunks)+1}: {num_chars} characters, {num_words} words")
        chunks.append(chunk_text)

    # Filter for English chunks only
    english_chunks = [c for c in chunks if is_english(c)]
    if len(english_chunks) < len(chunks):
        logging.warning(f"Skipped {len(chunks) - len(english_chunks)} non-English or metadata chunks.")
    logging.info(f"Total English Chunks: {len(english_chunks)}")
    return english_chunks
