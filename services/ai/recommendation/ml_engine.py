"""
ml_engine.py
============
Core ML logic for the SEPMS recommendation feature.

Two responsibilities:
  1. generate_embedding(text)  →  384-dim L2-normalised vector
  2. update_investor_profile(investor_vec, pitch_vec, action)  →  Rocchio update

Rocchio Algorithm
-----------------
We treat the investor's stored preference vector as a query vector and
each pitch interaction as a single-document feedback signal:

    new_vec = investor_vec  +  weight(action) × pitch_vec

Action weights:
    "click"   → +0.05  (implicit positive: investor viewed pitch details)
    "like"    → +0.30  (explicit positive: investor requested a meeting)
    "dislike" → -0.25  (explicit negative: investor rejected the pitch)

After the update the vector is L2-normalised so its magnitude stays at 1.
This is required for MongoDB Atlas Vector Search which uses cosine similarity.

Text input contract (what the Node backend sends)
-------------------------------------------------
The Node matching service builds the text before calling /api/embeddings/generate.

  Submission text  →  targetType="submission"
    title + summary + sector + stage +
    problem.statement + solution.description + businessModel.revenueStreams

  Investor text  →  targetType="investorProfile"
    fullName + preferredSectors + preferredStages +
    investmentType + industriesExpertise

The AI service only embeds whatever text it receives — it never constructs
these strings itself.
"""

from __future__ import annotations

import os

import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", None)

# Exposed so the Node backend can store it in EmbeddingEntry.modelVersion
MODEL_VERSION: str = f"sentence-transformers/{EMBEDDING_MODEL}"

# Rocchio action → weight mapping
_ACTION_WEIGHTS: dict[str, float] = {
    "click":   +0.05,
    "like":    +0.30,
    "dislike": -0.25,
}

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Load the model once and reuse it for every request."""
    global _model
    if _model is None:
        kwargs = {"cache_folder": MODEL_CACHE_DIR} if MODEL_CACHE_DIR else {}
        _model = SentenceTransformer(EMBEDDING_MODEL, **kwargs)
    return _model


def generate_embedding(text: str) -> list[float]:
    """
    Convert text into a 384-dim L2-normalised vector.

    normalize_embeddings=True ensures ‖v‖₂ = 1, which is required for
    cosine similarity to work correctly in MongoDB Atlas Vector Search.
    """
    vector: np.ndarray = _get_model().encode(
        text.strip() or "empty",
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vector.tolist()


def update_investor_profile(
    investor_vec: list[float],
    pitch_vec: list[float],
    action: str,
) -> list[float]:
    """
    Apply one Rocchio update step to an investor's preference vector.

    Formula:
        new_vec = investor_vec + weight(action) × pitch_vec
        new_vec = new_vec / ‖new_vec‖₂   ← L2 normalisation

    Raises ValueError for unknown action strings.
    """
    weight = _ACTION_WEIGHTS.get(action)
    if weight is None:
        raise ValueError(
            f"Unknown action '{action}'. Must be one of: {list(_ACTION_WEIGHTS)}"
        )

    iv = np.array(investor_vec, dtype=np.float64)
    pv = np.array(pitch_vec, dtype=np.float64)
    new_vec = iv + weight * pv

    norm = np.linalg.norm(new_vec)
    if norm > 0:
        new_vec = new_vec / norm

    return new_vec.tolist()
