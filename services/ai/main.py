"""
services/ai/main.py
===================
SEPMS AI Service — single entry point.

Run from services/ai/:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Structure
---------
services/ai/
├── main.py                  ← you are here
├── requirements.txt         ← single unified dependency file
├── recommendation/
│   ├── router.py            ← APIRouter: embeddings, matching, Rocchio
│   ├── ml_engine.py         ← sentence-transformers + Rocchio math
│   └── bulk_seed.py         ← standalone CSV ingestion script
└── classification/
    ├── router.py            ← APIRouter: /classify-pitch
    └── train_classifier.py  ← standalone model training script
"""

from fastapi import FastAPI

from recommendation.router import router as recommendation_router
from classification.router import router as classification_router

app = FastAPI(
    title="SEPMS AI Service",
    description="Recommendation (embeddings + Rocchio) and Classification (trust scoring).",
    version="1.0.0",
)

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health() -> dict:
    return {"status": "ok", "service": "SEPMS AI Service", "version": "1.0.0"}

# ── Feature routers ───────────────────────────────────────────────────────────

app.include_router(recommendation_router)
app.include_router(classification_router)
