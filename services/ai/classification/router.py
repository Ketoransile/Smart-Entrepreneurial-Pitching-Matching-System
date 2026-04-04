"""
router.py
=========
FastAPI APIRouter for the SEPMS pitch trust/quality classification feature.

Endpoint
--------
POST /classify-pitch
    Accepts a pitch text string and returns:
      - trust_score_percentage  : float  (0.0 – 100.0)
      - ai_flag                 : str    ("Flagged: Suspect Content" | "Pending Admin Review")

Integration
-----------
Import and mount this router in the main FastAPI app:

    from classification.router import router as classification_router
    app.include_router(classification_router)

Model loading
-------------
The trained pipeline (trust_score_model.pkl) is loaded once at startup.
If the file is missing, the server logs a clear warning but does NOT crash —
all other endpoints remain available. The /classify-pitch endpoint will
return a 503 until the model is trained.

To generate the model:
    cd services/ai/classification
    python train_classifier.py

Architecture constraints
------------------------
- Text only: no OCR, no PDF parsing, no image processing.
- No database connections: Node.js handles all persistence.
- predict_proba() is used (not predict()) so we get a calibrated
  probability rather than a hard 0/1 label.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ── Model loading ─────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "trust_score_model.pkl"

_model = None  # type: ignore[assignment]

try:
    _model = joblib.load(MODEL_PATH)
    logger.info("Trust score model loaded from %s", MODEL_PATH)
except FileNotFoundError:
    logger.warning(
        "trust_score_model.pkl not found at %s. "
        "Run `python train_classifier.py` inside services/ai/classification/ "
        "to generate the model before using the /classify-pitch endpoint.",
        MODEL_PATH,
    )
except Exception as exc:  # noqa: BLE001
    logger.error("Failed to load trust score model: %s", exc)

# ── Constants ─────────────────────────────────────────────────────────────────

# Probability threshold below which a pitch is flagged as suspect
FLAG_THRESHOLD = 40.0

# ── Pydantic schemas ──────────────────────────────────────────────────────────


class ClassifyPitchRequest(BaseModel):
    pitch_text: str = Field(
        ...,
        min_length=1,
        description="The raw pitch text to evaluate (e.g. Submission.summary or One_Line_Pitch)",
    )


class ClassifyPitchResponse(BaseModel):
    trust_score_percentage: float = Field(
        ...,
        description="Probability (0–100) that the pitch is high-quality / verified",
    )
    ai_flag: str = Field(
        ...,
        description="'Flagged: Suspect Content' if score < 40, else 'Pending Admin Review'",
    )


# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Classification"])


@router.post("/classify-pitch", response_model=ClassifyPitchResponse)
def classify_pitch(payload: ClassifyPitchRequest) -> ClassifyPitchResponse:
    """
    Evaluate a pitch text and return a trust/quality score.

    The underlying scikit-learn pipeline uses TF-IDF features fed into a
    LogisticRegression classifier trained on labelled startup pitch data.

    predict_proba() returns [P(class=0), P(class=1)].
    We extract P(class=1) — the probability of being "High Quality" —
    multiply by 100, and round to 2 decimal places.

    Flag logic:
        score < 40.0  →  "Flagged: Suspect Content"
        score >= 40.0 →  "Pending Admin Review"
    """
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Classification model is not loaded. "
                "Run `python train_classifier.py` inside services/ai/classification/ first."
            ),
        )

    # predict_proba returns shape (n_samples, n_classes)
    # We pass a single-element list and take the first row
    proba = _model.predict_proba([payload.pitch_text])[0]

    # Index 1 = probability of class "1" (High Quality)
    # The pipeline's classes_ order is guaranteed to be [0, 1] by sklearn
    high_quality_proba = float(proba[1])
    trust_score = round(high_quality_proba * 100, 2)

    ai_flag = (
        "Flagged: Suspect Content"
        if trust_score < FLAG_THRESHOLD
        else "Pending Admin Review"
    )

    return ClassifyPitchResponse(
        trust_score_percentage=trust_score,
        ai_flag=ai_flag,
    )
