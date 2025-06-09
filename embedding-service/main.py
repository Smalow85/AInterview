from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')


class EmbeddingRequest(BaseModel):
    text: str

class SingleEmbeddingRequest(BaseModel):
    text: str

class BatchEmbeddingRequest(BaseModel):
    texts: List[str]


@app.post("/embed", response_model=EmbeddingResponse)
def embed_single(request: SingleEmbeddingRequest):
    embedding = generate_embedding(request.text)
    return EmbeddingResponse(embeddings=[embedding])

@app.post("/embed-by-batch", response_model=EmbeddingResponse)
def embed_batch(request: BatchEmbeddingRequest):
    embeddings = generate_embeddings(request.texts)
    return EmbeddingResponse(embeddings=embeddings)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
