from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

MODEL_NAME = "intfloat/multilingual-e5-large-instruct"
TASK_DESCRIPTION = (
    "Given a Vietnamese or English clinic chatbot query, "
    "retrieve relevant passages from dermatology clinic knowledge base documents."
)

app = FastAPI(title="Clinic Chatbot Embedding Service")
model = SentenceTransformer(MODEL_NAME)


class EmbedRequest(BaseModel):
    texts: list[str]
    type: str = "query"


def format_input(text: str, input_type: str) -> str:
    if input_type == "query":
        return f"Instruct: {TASK_DESCRIPTION}\nQuery: {text}"
    return text


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME}


@app.post("/embed")
def embed(req: EmbedRequest):
    inputs = [format_input(text, req.type) for text in req.texts]
    vectors = model.encode(inputs, normalize_embeddings=True)
    return {
        "model": MODEL_NAME,
        "dimension": int(vectors.shape[1]),
        "vectors": vectors.tolist(),
    }
