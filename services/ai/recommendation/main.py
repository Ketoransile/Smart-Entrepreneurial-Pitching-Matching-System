"""
main.py
=======
FastAPI application for the SEPMS recommendation feature.

Run with:
    cd services/ai/recommendation
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Endpoints
---------
GET  /                          health check

# Called by the Node backend (ai.service.ts)
POST /api/embeddings/generate   text → 384-dim vector + modelVersion
POST /api/submissions/analyze   pitch fields → score, summary, highlights, risks
POST /api/matching/score        submission + investor fields → weighted match score

# Rocchio feedback loop
POST /vectorize                 text → vector  (simple alias used by bulk_seed.py)
POST /train_profile             one Rocchio update step on an investor vector
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ml_engine import (
    MODEL_VERSION,
    generate_embedding,
    update_investor_profile,
)

app = FastAPI(
    title="SEPMS Recommendation Service",
    version="1.0.0",
)


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/")
def health() -> dict:
    return {"status": "ok", "service": "SEPMS Recommendation Service"}


# ─── Embedding (called by Node AIService.generateEmbedding) ──────────────────

class EmbeddingRequest(BaseModel):
    text: str
    # targetType and targetId are sent by the Node backend and stored in
    # EmbeddingEntry — we receive them but only need text for the vector
    targetType: str = Field(..., description="submission | entrepreneurProfile | investorProfile")
    targetId: str   = Field(..., description="MongoDB ObjectId of the target document")

class EmbeddingResponse(BaseModel):
    vector: list[float]
    modelVersion: str

@app.post("/api/embeddings/generate", response_model=EmbeddingResponse)
def generate(payload: EmbeddingRequest) -> EmbeddingResponse:
    """
    Generate a 384-dim L2-normalised embedding.
    The Node backend stores the returned vector in EmbeddingEntry.vector
    and modelVersion in EmbeddingEntry.modelVersion.
    """
    return EmbeddingResponse(
        vector=generate_embedding(payload.text),
        modelVersion=MODEL_VERSION,
    )


# ─── Submission analysis (called by Node AIService.analyzeSubmission) ─────────

class AnalyzeSubmissionRequest(BaseModel):
    submissionId: str
    title: str
    summary: str
    sector: str   # Submission.sector enum
    stage: str    # Submission.stage enum
    targetAmount: float | None = None
    # Maps to Submission.problem.statement
    problemStatement: str | None = None
    # Maps to Submission.solution.description
    solutionDescription: str | None = None
    # Maps to Submission.businessModel.revenueStreams
    revenueStreams: str | None = None

class AnalyzeSubmissionResponse(BaseModel):
    score: float = Field(..., ge=0, le=1)
    summary: str
    highlights: list[str]
    risks: list[str]

@app.post("/api/submissions/analyze", response_model=AnalyzeSubmissionResponse)
def analyze_submission(payload: AnalyzeSubmissionRequest) -> AnalyzeSubmissionResponse:
    """
    Score a pitch submission on content completeness (0-1 scale).

    Scoring:
      base 0.35 + completeness × 0.50 (4 fields) + 0.15 if targetAmount > 0

    The four completeness fields map directly to the Submission mongoose schema:
      summary              → Submission.summary
      problemStatement     → Submission.problem.statement
      solutionDescription  → Submission.solution.description
      revenueStreams        → Submission.businessModel.revenueStreams
    """
    fields = [
        payload.summary,
        payload.problemStatement,
        payload.solutionDescription,
        payload.revenueStreams,
    ]
    filled = sum(1 for f in fields if isinstance(f, str) and len(f.strip()) > 10)
    completeness = filled / len(fields)
    amount_bonus = 0.15 if (payload.targetAmount and payload.targetAmount > 0) else 0.0
    score = round(min(1.0, 0.35 + completeness * 0.50 + amount_bonus), 4)

    highlights = [
        label for label, val in [
            ("Problem statement captured",    payload.problemStatement),
            ("Solution description provided", payload.solutionDescription),
            ("Funding target defined",        payload.targetAmount),
            ("Revenue streams outlined",      payload.revenueStreams),
        ]
        if val and (isinstance(val, str) and val.strip() or not isinstance(val, str))
    ]

    risks = [
        label for label, val in [
            ("Missing executive summary",   payload.summary),
            ("Revenue streams not defined", payload.revenueStreams),
            ("No problem statement",        payload.problemStatement),
        ]
        if not (val and isinstance(val, str) and val.strip())
    ]

    quality = "strong" if score >= 0.7 else "moderate" if score >= 0.5 else "weak"
    outcome = "ready for investor matching." if score >= 0.7 else "needs more detail before high-confidence matching."

    return AnalyzeSubmissionResponse(
        score=score,
        summary=f"Submission is structurally {quality} and {outcome}",
        highlights=highlights,
        risks=risks,
    )


# ─── Match scoring (called by Node AIService.computeMatchScore) ───────────────

class ScoreBreakdown(BaseModel):
    sector: float
    stage: float
    budget: float
    embedding: float

class MatchScoreRequest(BaseModel):
    submissionId: str
    investorId: str
    # EmbeddingEntry.vector for targetType="submission"
    submissionEmbedding: list[float] | None = None
    # EmbeddingEntry.vector for targetType="investorProfile"
    investorEmbedding: list[float] | None = None
    # Submission.sector
    submissionSector: str
    # Submission.stage
    submissionStage: str
    # Submission.targetAmount
    targetAmount: float | None = None
    # InvestorProfile.preferredSectors
    preferredSectors: list[str] = []
    # InvestorProfile.preferredStages
    preferredStages: list[str] = []
    # InvestorProfile.investmentRange.min
    investmentRangeMin: float | None = None
    # InvestorProfile.investmentRange.max
    investmentRangeMax: float | None = None

class MatchScoreResponse(BaseModel):
    score: float = Field(..., ge=0, le=1)
    rationale: str
    breakdown: ScoreBreakdown

@app.post("/api/matching/score", response_model=MatchScoreResponse)
def compute_match_score(payload: MatchScoreRequest) -> MatchScoreResponse:
    """
    Weighted match score between a submission and an investor.

    Weights (mirror the Node fallback in ai.service.ts):
      sector   35%  — Submission.sector vs InvestorProfile.preferredSectors
      stage    20%  — Submission.stage  vs InvestorProfile.preferredStages
      budget   25%  — Submission.targetAmount vs InvestorProfile.investmentRange
      embedding 20% — cosine similarity of 384-dim EmbeddingEntry vectors

    Sector note: Submission uses "fintech" while InvestorProfile uses "finance".
    Both are treated as a match.
    """
    # Sector score
    normalised = "finance" if payload.submissionSector == "fintech" else payload.submissionSector
    if normalised in payload.preferredSectors or payload.submissionSector in payload.preferredSectors:
        sector_score = 1.0
    elif "other" in payload.preferredSectors:
        sector_score = 0.5
    else:
        sector_score = 0.2

    # Stage score
    stage_score = 1.0 if payload.submissionStage in payload.preferredStages else 0.3

    # Budget score
    if (
        isinstance(payload.targetAmount, (int, float)) and payload.targetAmount > 0
        and isinstance(payload.investmentRangeMin, (int, float))
        and isinstance(payload.investmentRangeMax, (int, float))
    ):
        budget_score = (
            1.0
            if payload.investmentRangeMin <= payload.targetAmount <= payload.investmentRangeMax
            else 0.25
        )
    else:
        budget_score = 0.6

    # Embedding score (cosine similarity mapped to [0, 1])
    if payload.submissionEmbedding and payload.investorEmbedding:
        import numpy as np
        a = np.array(payload.submissionEmbedding, dtype=np.float64)
        b = np.array(payload.investorEmbedding, dtype=np.float64)
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na > 0 and nb > 0 and len(payload.submissionEmbedding) == len(payload.investorEmbedding):
            raw = float(np.dot(a, b) / (na * nb))
            embedding_score = max(0.0, min(1.0, (raw + 1.0) / 2.0))
        else:
            embedding_score = 0.5
    else:
        embedding_score = 0.5

    score = round(
        max(0.0, min(1.0,
            sector_score    * 0.35 +
            stage_score     * 0.20 +
            budget_score    * 0.25 +
            embedding_score * 0.20
        )),
        4,
    )

    rationale = (
        "Strong alignment across sector, stage, and investment profile" if score >= 0.75
        else "Moderate alignment with partial fit in target criteria"   if score >= 0.50
        else "Low alignment — significant mismatch in key criteria"
    )

    return MatchScoreResponse(
        score=score,
        rationale=rationale,
        breakdown=ScoreBreakdown(
            sector=round(sector_score, 4),
            stage=round(stage_score, 4),
            budget=round(budget_score, 4),
            embedding=round(embedding_score, 4),
        ),
    )


# ─── Rocchio endpoints ────────────────────────────────────────────────────────

class VectorizeRequest(BaseModel):
    text: str

class VectorizeResponse(BaseModel):
    vector: list[float]

@app.post("/vectorize", response_model=VectorizeResponse)
def vectorize(payload: VectorizeRequest) -> VectorizeResponse:
    """Simple alias used by bulk_seed.py and direct testing."""
    return VectorizeResponse(vector=generate_embedding(payload.text))


class TrainProfileRequest(BaseModel):
    investor_vector: list[float] = Field(..., description="Current investor preference vector (384-dim)")
    pitch_vector:    list[float] = Field(..., description="Embedding of the pitch interacted with (384-dim)")
    action:          str         = Field(..., description="click | like | dislike")

class TrainProfileResponse(BaseModel):
    new_vector: list[float]

@app.post("/train_profile", response_model=TrainProfileResponse)
def train_profile(payload: TrainProfileRequest) -> TrainProfileResponse:
    """
    One Rocchio update step on an investor's preference vector.

    Weights:  click +0.05 | like +0.30 | dislike -0.25
    The returned vector is L2-normalised for Atlas cosine similarity.
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
