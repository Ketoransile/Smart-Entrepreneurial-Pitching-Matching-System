"""
router.py
=========
Hybrid classification pipeline for SEPMS pitch trust scoring.

Architecture
------------
Two complementary layers run in sequence for every pitch evaluation:

Layer 1 — Google Gemini API (authenticity & language check)
    Purpose : Detect gibberish, non-English text, copy-paste garbage, and
              off-topic content that TF-IDF cannot catch because those inputs
              produce near-zero feature vectors.
    Input   : Raw pitch text
    Output  : { is_gibberish, language_quality, confidence, gemini_note }

Layer 2 — scikit-learn TF-IDF + Logistic Regression (quality scoring)
    Purpose : Score the pitch against patterns learned from 500+ real funded
              startups (Crunchbase dataset). Produces a calibrated probability
              that the pitch resembles a high-quality, investor-ready submission.
    Input   : Raw pitch text (only reached if Layer 1 passes)
    Output  : trust_score_percentage (0–100), ai_flag

Combined response to the admin:
    {
        trust_score_percentage : float   ← from scikit-learn
        ai_flag                : str     ← derived from trust_score + gemini result
        authenticity           : {
            is_gibberish       : bool
            language_quality   : "professional" | "acceptable" | "poor" | "gibberish"
            confidence         : float (0–1)
            gemini_note        : str    ← human-readable explanation for the admin
        }
    }

If Gemini is unavailable (no API key, network error), the system falls back
to the scikit-learn result alone — the endpoint never crashes.

Environment variables required
-------------------------------
    GEMINI_API_KEY=your-key-here   (get from https://aistudio.google.com/app/apikey)
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional

import joblib
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel, Field

load_dotenv()

logger = logging.getLogger(__name__)

# ── scikit-learn model loading ────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "trust_score_model.pkl"

_sklearn_model = None  # type: ignore[assignment]

try:
    _sklearn_model = joblib.load(MODEL_PATH)
    logger.info("scikit-learn trust score model loaded from %s", MODEL_PATH)
except FileNotFoundError:
    logger.warning(
        "trust_score_model.pkl not found. "
        "Run `python train_classifier.py` inside services/ai/classification/ first."
    )
except Exception as exc:  # noqa: BLE001
    logger.error("Failed to load scikit-learn model: %s", exc)

# ── Gemini client initialisation ──────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_gemini_model = None

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai  # type: ignore[import]
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,   # low temperature → deterministic, factual output
            ),
        )
        logger.info("Gemini model initialised (gemini-1.5-flash)")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gemini initialisation failed: %s — authenticity layer disabled", exc)
else:
    logger.warning("GEMINI_API_KEY not set — authenticity layer will be skipped")

# ── Constants ─────────────────────────────────────────────────────────────────

FLAG_THRESHOLD = 40.0  # trust_score below this → "Flagged: Suspect Content"

# ── Pydantic schemas ──────────────────────────────────────────────────────────


class AuthenticityResult(BaseModel):
    is_gibberish: bool = Field(..., description="True if the text is random characters or nonsense")
    language_quality: str = Field(
        ...,
        description="professional | acceptable | poor | gibberish"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Gemini confidence in its assessment")
    gemini_note: str = Field(..., description="Human-readable explanation for the admin")


class ClassifyPitchRequest(BaseModel):
    pitch_text: str = Field(..., min_length=1)


class ClassifyPitchResponse(BaseModel):
    trust_score_percentage: float = Field(
        ...,
        description="0–100 probability from scikit-learn that pitch resembles a funded startup"
    )
    ai_flag: str = Field(
        ...,
        description="'Flagged: Suspect Content' or 'Pending Admin Review'"
    )
    authenticity: Optional[AuthenticityResult] = Field(
        None,
        description="Gemini authenticity analysis (null if Gemini unavailable)"
    )


# ── Gemini authenticity check ─────────────────────────────────────────────────

_GEMINI_PROMPT = """
You are an AI quality gate for a startup investment platform.
Analyse the following pitch text and return a JSON object with exactly these fields:

{{
  "is_gibberish": <true if the text is random characters, keyboard mashing, or completely meaningless — false otherwise>,
  "language_quality": <one of: "professional", "acceptable", "poor", "gibberish">,
  "confidence": <your confidence in this assessment, float between 0.0 and 1.0>,
  "gemini_note": <one sentence explaining your assessment to a human admin reviewer>
}}

Rules:
- "professional": clear business language, domain-specific terms, coherent argument
- "acceptable": understandable but informal or incomplete
- "poor": vague, generic, or very low effort but still real language
- "gibberish": random characters (e.g. "sdfhsdlf"), keyboard mashing, or completely incoherent

Pitch text to evaluate:
\"\"\"
{pitch_text}
\"\"\"

Return ONLY the JSON object. No markdown, no explanation outside the JSON.
"""


def _run_gemini_authenticity(pitch_text: str) -> AuthenticityResult | None:
    """
    Call Gemini to assess whether the pitch text is authentic and in English.
    Returns None if Gemini is unavailable or the call fails.
    """
    if _gemini_model is None:
        return None

    try:
        prompt = _GEMINI_PROMPT.format(pitch_text=pitch_text[:3000])  # cap at 3000 chars
        response = _gemini_model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences if Gemini wraps the JSON
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        data = json.loads(raw)
        return AuthenticityResult(
            is_gibberish=bool(data.get("is_gibberish", False)),
            language_quality=str(data.get("language_quality", "acceptable")),
            confidence=float(data.get("confidence", 0.5)),
            gemini_note=str(data.get("gemini_note", "")),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gemini authenticity check failed: %s", exc)
        return None


# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Classification"])


@router.post("/classify-pitch", response_model=ClassifyPitchResponse)
def classify_pitch(payload: ClassifyPitchRequest) -> ClassifyPitchResponse:
    """
    Hybrid pitch classification endpoint.

    Execution order:
    1. Gemini evaluates authenticity and language quality.
       - If Gemini flags the text as gibberish → trust_score = 0, flagged immediately.
       - If Gemini is unavailable → skip to step 2.
    2. scikit-learn TF-IDF + Logistic Regression computes the quality score.
       - predict_proba()[1] = P(high quality) based on patterns from funded startups.
       - Multiplied by 100 → trust_score_percentage.
    3. Final ai_flag is derived from both layers:
       - Gibberish (Gemini) → "Flagged: Suspect Content"
       - trust_score < 40   → "Flagged: Suspect Content"
       - Otherwise          → "Pending Admin Review"
    """
    # ── Layer 1: Gemini authenticity check ───────────────────────────────────
    authenticity = _run_gemini_authenticity(payload.pitch_text)

    # If Gemini confirms gibberish, short-circuit — no need to run scikit-learn
    if authenticity is not None and authenticity.is_gibberish:
        return ClassifyPitchResponse(
            trust_score_percentage=0.0,
            ai_flag="Flagged: Suspect Content",
            authenticity=authenticity,
        )

    # ── Layer 2: scikit-learn quality scoring ─────────────────────────────────
    trust_score = 50.0  # neutral fallback if model not loaded

    if _sklearn_model is not None:
        # predict_proba returns [[P(class=0), P(class=1)]]
        # class 1 = "High Quality" (Series A+, or raised > $1M in training data)
        proba = _sklearn_model.predict_proba([payload.pitch_text])[0]
        trust_score = round(float(proba[1]) * 100, 2)

    # ── Derive final flag ─────────────────────────────────────────────────────
    # Flag if scikit-learn score is low OR if Gemini rated language as poor/gibberish
    gemini_poor = (
        authenticity is not None
        and authenticity.language_quality in ("poor", "gibberish")
    )

    ai_flag = (
        "Flagged: Suspect Content"
        if trust_score < FLAG_THRESHOLD or gemini_poor
        else "Pending Admin Review"
    )

    return ClassifyPitchResponse(
        trust_score_percentage=trust_score,
        ai_flag=ai_flag,
        authenticity=authenticity,
    )
