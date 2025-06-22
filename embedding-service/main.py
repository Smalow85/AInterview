import uuid
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import nltk
import ssl
from nltk.tokenize import sent_tokenize

from sentence_transformers import SentenceTransformer

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from fastapi.middleware.cors import CORSMiddleware

import fitz
import docx

# Fix SSL certificate issues for NLTK downloads
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Set NLTK data path and download punkt_tab (new format)
nltk.data.path.append("/usr/local/nltk_data")
try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    print("Downloading punkt_tab tokenizer...")
    try:
        nltk.download("punkt_tab", download_dir="/usr/local/nltk_data", quiet=True)
    except Exception as e:
        print(f"Failed to download punkt_tab: {e}")
        # Fallback to older punkt if punkt_tab fails
        try:
            nltk.download("punkt", download_dir="/usr/local/nltk_data", quiet=True)
        except Exception as e2:
            print(f"Failed to download punkt: {e2}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # или ["*"] для всех
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VECTOR_SIZE = 384
COLLECTION_NAME = "documents"

model = SentenceTransformer("all-MiniLM-L6-v2")
qdrant = QdrantClient(host="qdrant", port=6333)

qdrant.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
)

def smart_chunk(text: str, max_chars: int = 500) -> List[str]:
    try:
        sentences = sent_tokenize(text)
    except LookupError as e:
        # Fallback if punkt_tab/punkt is still not available
        print(f"Warning: NLTK tokenizer not available ({e}), using simple sentence splitting")
        sentences = text.split('. ')
        sentences = [s.strip() + '.' for s in sentences if s.strip()]
    
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) <= max_chars:
            current += " " + sentence
        else:
            if current:
                chunks.append(current.strip())
            current = sentence

    if current:
        chunks.append(current.strip())

    return chunks

def extract_text_from_file(file: UploadFile) -> str:
    if file.filename.endswith(".txt"):
        return file.file.read().decode("utf-8")
    elif file.filename.endswith(".pdf"):
        doc = fitz.open(stream=file.file.read(), filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    elif file.filename.endswith(".docx"):
        doc = docx.Document(file.file)
        return "\n".join(p.text for p in doc.paragraphs)
    else:
        raise ValueError("Unsupported file type")

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        text = extract_text_from_file(file)
        chunks = smart_chunk(text)
        vectors = model.encode(chunks, normalize_embeddings=True)

        points = []
        for i, vector in enumerate(vectors):
            points.append(PointStruct(
                id=str(uuid.uuid4()),
                vector=vector.tolist(),
                payload={
                    "chunk": chunks[i],
                    "filename": file.filename
                }
            ))

        qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        return {"uploaded_chunks": len(points), "filename": file.filename}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

class SearchRequest(BaseModel):
    query: str

@app.post("/search")
def search_text(req: SearchRequest):
    vector = model.encode([req.query], normalize_embeddings=True)[0]
    hits = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector.tolist(),
        limit=5
    )

    return [{
        "score": h.score,
        "chunk": h.payload.get("chunk"),
        "filename": h.payload.get("filename")
    } for h in hits]