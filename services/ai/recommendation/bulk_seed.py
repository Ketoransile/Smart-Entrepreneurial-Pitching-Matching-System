"""
bulk_seed.py
============
Seed a Crunchbase/Kaggle CSV into SEPMS via the recommendation service.

Usage:
    cd services/ai/recommendation
    python bulk_seed.py --csv path/to/startups.csv

Steps per row:
  1. Build a summary string (mirrors buildSubmissionText in matching.service.ts)
  2. POST /vectorize  →  get 384-dim embedding
  3. POST http://localhost:5000/api/submissions/seed  →  create submission in Node

Submission fields sent (map to Submission mongoose schema):
  title    → Submission.title
  sector   → Submission.sector  (mapped from CSV "market" column)
  summary  → Submission.summary
  stage    → "mvp"  (default for seeded data)
  embedding → used by Node to create EmbeddingEntry
"""

import argparse
import time

import pandas as pd
import requests

VECTORIZE_URL = "http://localhost:8000/vectorize"
SEED_URL      = "http://localhost:5000/api/submissions/seed"
MAX_ROWS      = 500
SLEEP_SEC     = 0.3  # throttle between requests

# Submission.sector valid values
VALID_SECTORS = {
    "technology", "healthcare", "fintech", "education",
    "agriculture", "energy", "real_estate", "manufacturing",
    "retail", "other",
}

# Map common Crunchbase market strings → Submission.sector enum
SECTOR_MAP = {
    "finance":           "fintech",
    "financial services":"fintech",
    "health":            "healthcare",
    "health care":       "healthcare",
    "real estate":       "real_estate",
    "clean energy":      "energy",
    "cleantech":         "energy",
    "edtech":            "education",
    "e-commerce":        "retail",
    "ecommerce":         "retail",
}
# 

def load_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    if "short_description" in df.columns and "description" not in df.columns:
        df = df.rename(columns={"short_description": "description"})
    missing = {"name", "description"} - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}. Found: {list(df.columns)}")
    df = df.dropna(subset=["description"])
    df = df[df["description"].str.strip().str.len() > 0]
    df = df.head(MAX_ROWS).reset_index(drop=True)
    print(f"Loaded {len(df)} rows.")
    return df


def map_sector(market: str) -> str:
    if not market or str(market).lower() in ("nan", ""):
        return "other"
    n = str(market).strip().lower()
    return n if n in VALID_SECTORS else SECTOR_MAP.get(n, "other")


def build_text(row: pd.Series) -> str:
    """Mirrors buildSubmissionText() in matching.service.ts."""
    parts = [
        str(row.get("name", "")).strip(),
        str(row.get("market", "")).strip(),
        str(row.get("description", "")).strip(),
    ]
    return "\n".join(p for p in parts if p and p.lower() != "nan")


def main(csv_path: str) -> None:
    df = load_csv(csv_path)
    ok, fail = 0, 0

    for idx, row in df.iterrows():
        title   = str(row.get("name", f"Startup #{idx}")).strip()
        sector  = map_sector(str(row.get("market", "")))
        summary = build_text(row)

        try:
            vec = requests.post(VECTORIZE_URL, json={"text": summary}, timeout=30)
            vec.raise_for_status()
            embedding = vec.json()["vector"]

            seed = requests.post(SEED_URL, json={
                "title":     title,
                "sector":    sector,
                "summary":   summary,
                "stage":     "mvp",
                "embedding": embedding,
            }, timeout=30)
            seed.raise_for_status()
            ok += 1
            print(f"[{idx+1}/{len(df)}] ✅  {title[:60]}")
        except Exception as e:
            fail += 1
            print(f"[{idx+1}/{len(df)}] ❌  {title[:50]} — {e}")

        time.sleep(SLEEP_SEC)

    print(f"\nDone. {ok} seeded, {fail} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to Crunchbase CSV")
    main(parser.parse_args().csv)
