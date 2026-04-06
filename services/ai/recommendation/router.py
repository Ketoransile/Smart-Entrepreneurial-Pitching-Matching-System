"""
recommendation/router.py
========================
APIRouter for all recommendation feature endpoints.

Mounted at root prefix in services/ai/main.py.

Endpoints
---------
POST /api/embeddings/generate   — text → 384-dim vector (called by Node AIService)
POST /api/submissions/analyze   — pitch fields → completeness score
POST /api/matching/score        — submission + investor → weighted match score
POST /vectorize                 — text → vector (alias used by bulk_seed.py)
POST /train_profile             — one Rocchio update step on an investor vector
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from recommendation.ml_engine import (
    MODEL_VERSION,
    generate_embedding,
    update_investor_profile,
)

router = APIRouter(tags=["Recommendation"])


# ─── Embedding ────────────────────────────────────────────────────────────────

class EmbeddingRequest(BaseModel):
    text: str
    targetType: str = Field(..., description="submission | entrepreneurProfile | investorProfile")
    targetId: str   = Field(..., description="MongoDB ObjectId of the target document")

class EmbeddingResponse(BaseModel):
    vector: list[float]
    modelVersion: str

@router.post("/api/embeddings/generate", response_model=EmbeddingResponse)
def generate(payload: EmbeddingRequest) -> EmbeddingResponse:
    """
    Generate a 384-dim L2-normalised embedding.
    Stored by Node backend in EmbeddingEntry.vector / modelVersion.
    """
    print(f"[EMBEDDING] targetType={payload.targetType} targetId={payload.targetId} text_len={len(payload.text)}")
    vec = generate_embedding(payload.text)
    print(f"[EMBEDDING] ✅ generated {len(vec)}-dim vector for {payload.targetType}")
    return EmbeddingResponse(vector=vec, modelVersion=MODEL_VERSION)


# ─── Submission analysis ──────────────────────────────────────────────────────

class AnalyzeSubmissionRequest(BaseModel):
    submissionId: str
    title: str
    summary: str
    sector: str
    stage: str
    targetAmount: float | None = None
    problemStatement: str | None = None    # Submission.problem.statement
    solutionDescription: str | None = None # Submission.solution.description
    revenueStreams: str | None = None       # Submission.businessModel.revenueStreams

class AnalyzeSubmissionResponse(BaseModel):
    score: float = Field(..., ge=0, le=1)
    summary: str
    highlights: list[str]
    risks: list[str]

@router.post("/api/submissions/analyze", response_model=AnalyzeSubmissionResponse)
def analyze_submission(payload: AnalyzeSubmissionRequest) -> AnalyzeSubmissionResponse:
    """
    Score a pitch on content completeness (0–1).
    base 0.35 + completeness×0.50 (4 fields) + 0.15 if targetAmount > 0
    """
    fields = [payload.summary, payload.problemStatement,
              payload.solutionDescription, payload.revenueStreams]
    filled = sum(1 for f in fields if isinstance(f, str) and len(f.strip()) > 10)
    score = round(min(1.0, 0.35 + (filled / len(fields)) * 0.50 +
                      (0.15 if payload.targetAmount and payload.targetAmount > 0 else 0.0)), 4)

    print(f"[ANALYZE] submissionId={payload.submissionId} sector={payload.sector} stage={payload.stage} filled={filled}/4 score={score}")

    highlights = [label for label, val in [
        ("Problem statement captured",    payload.problemStatement),
        ("Solution description provided", payload.solutionDescription),
        ("Funding target defined",        payload.targetAmount),
        ("Revenue streams outlined",      payload.revenueStreams),
    ] if val and (isinstance(val, str) and val.strip() or not isinstance(val, str))]

    risks = [label for label, val in [
        ("Missing executive summary",   payload.summary),
        ("Revenue streams not defined", payload.revenueStreams),
        ("No problem statement",        payload.problemStatement),
    ] if not (val and isinstance(val, str) and val.strip())]

    quality = "strong" if score >= 0.7 else "moderate" if score >= 0.5 else "weak"
    outcome = "ready for investor matching." if score >= 0.7 else "needs more detail before high-confidence matching."

    return AnalyzeSubmissionResponse(
        score=score,
        summary=f"Submission is structurally {quality} and {outcome}",
        highlights=highlights,
        risks=risks,
    )


# ─── Match scoring ────────────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    sector: float
    stage: float
    budget: float
    embedding: float

class MatchScoreRequest(BaseModel):
    submissionId: str
    investorId: str
    submissionEmbedding: list[float] | None = None  # EmbeddingEntry.vector targetType="submission"
    investorEmbedding: list[float] | None = None    # EmbeddingEntry.vector targetType="investorProfile"
    submissionSector: str                           # Submission.sector
    submissionStage: str                            # Submission.stage
    targetAmount: float | None = None               # Submission.targetAmount
    preferredSectors: list[str] = []                # InvestorProfile.preferredSectors
    preferredStages: list[str] = []                 # InvestorProfile.preferredStages
    investmentRangeMin: float | None = None         # InvestorProfile.investmentRange.min
    investmentRangeMax: float | None = None         # InvestorProfile.investmentRange.max

class MatchScoreResponse(BaseModel):
    score: float = Field(..., ge=0, le=1)
    rationale: str
    breakdown: ScoreBreakdown

@router.post("/api/matching/score", response_model=MatchScoreResponse)
def compute_match_score(payload: MatchScoreRequest) -> MatchScoreResponse:
    """
    Weighted match score: sector 35% | stage 20% | budget 25% | embedding 20%
    Submission "fintech" is treated as equivalent to InvestorProfile "finance".
    """
    import numpy as np

    # Sector
    normalised = "finance" if payload.submissionSector == "fintech" else payload.submissionSector
    if normalised in payload.preferredSectors or payload.submissionSector in payload.preferredSectors:
        sector_score = 1.0
    elif "other" in payload.preferredSectors:
        sector_score = 0.5
    else:
        sector_score = 0.2

    # Stage
    stage_score = 1.0 if payload.submissionStage in payload.preferredStages else 0.3

    # Budget
    if (isinstance(payload.targetAmount, (int, float)) and payload.targetAmount > 0
            and isinstance(payload.investmentRangeMin, (int, float))
            and isinstance(payload.investmentRangeMax, (int, float))):
        budget_score = (1.0 if payload.investmentRangeMin <= payload.targetAmount
                        <= payload.investmentRangeMax else 0.25)
    else:
        budget_score = 0.6

    # Embedding (cosine similarity → [0, 1])
    if payload.submissionEmbedding and payload.investorEmbedding:
        a = np.array(payload.submissionEmbedding, dtype=np.float64)
        b = np.array(payload.investorEmbedding, dtype=np.float64)
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na > 0 and nb > 0 and len(payload.submissionEmbedding) == len(payload.investorEmbedding):
            embedding_score = max(0.0, min(1.0, (float(np.dot(a, b) / (na * nb)) + 1.0) / 2.0))
        else:
            embedding_score = 0.5
    else:
        embedding_score = 0.5

    score = round(max(0.0, min(1.0,
        sector_score * 0.35 + stage_score * 0.20 +
        budget_score * 0.25 + embedding_score * 0.20)), 4)

    print(f"[MATCH] sub={payload.submissionId[:8]} inv={payload.investorId[:8]} "
          f"sector={sector_score:.2f} stage={stage_score:.2f} budget={budget_score:.2f} "
          f"embedding={embedding_score:.2f} TOTAL={score:.4f} "
          f"(sub_sector={payload.submissionSector} pref={payload.preferredSectors})")

    rationale = (
        "Strong alignment across sector, stage, and investment profile" if score >= 0.75
        else "Moderate alignment with partial fit in target criteria" if score >= 0.50
        else "Low alignment — significant mismatch in key criteria"
    )

    return MatchScoreResponse(
        score=score, rationale=rationale,
        breakdown=ScoreBreakdown(
            sector=round(sector_score, 4), stage=round(stage_score, 4),
            budget=round(budget_score, 4), embedding=round(embedding_score, 4),
        ),
    )


# ─── Rocchio ──────────────────────────────────────────────────────────────────

class VectorizeRequest(BaseModel):
    text: str

class VectorizeResponse(BaseModel):
    vector: list[float]

@router.post("/vectorize", response_model=VectorizeResponse)
def vectorize(payload: VectorizeRequest) -> VectorizeResponse:
    """Simple alias used by bulk_seed.py and direct testing."""
    return VectorizeResponse(vector=generate_embedding(payload.text))


class TrainProfileRequest(BaseModel):
    investor_vector: list[float] = Field(..., description="Current investor preference vector (384-dim)")
    pitch_vector:    list[float] = Field(..., description="Embedding of the pitch interacted with (384-dim)")
    action:          str         = Field(..., description="click | like | dislike")

class TrainProfileResponse(BaseModel):
    new_vector: list[float]

@router.post("/train_profile", response_model=TrainProfileResponse)
def train_profile(payload: TrainProfileRequest) -> TrainProfileResponse:
    """
    One Rocchio update step. Weights: click +0.05 | like +0.30 | dislike -0.25
    Returns L2-normalised vector for Atlas cosine similarity.
    """
    try:
        new_vector = update_investor_profile(
            investor_vec=payload.investor_vector,
            pitch_vec=payload.pitch_vector,
            action=payload.action,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return TrainProfileResponse(new_vector=new_vector)
