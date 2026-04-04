"""
train_classifier.py
===================
Training script for the SEPMS pitch trust/quality classifier.

Usage
-----
    cd services/ai/classification
    python train_classifier.py

    # Or point to a different CSV:
    python train_classifier.py --csv ../startup_company_one_line_pitches.csv

What it does
------------
1. Loads startup_pitches.csv (Kaggle Crunchbase-style dataset).
2. Creates a binary label y:
       y = 1  ("High Quality / Verified")
           if Funding_Stage in {Series A, Series B, Series C, Series D, IPO}
           OR Last_Funding_Amount_USD_Millions > 1.0
       y = 0  ("Unproven / Low Quality") otherwise
3. Uses One_Line_Pitch as the sole text feature X.
4. Trains a scikit-learn Pipeline:
       TfidfVectorizer(stop_words='english', max_features=3000)
       → LogisticRegression(max_iter=1000, class_weight='balanced')
5. Prints a classification_report on the held-out test set.
6. Saves the fitted pipeline as trust_score_model.pkl (joblib).

Why LogisticRegression over RandomForest?
------------------------------------------
For short one-line text features (< 20 words), logistic regression on
TF-IDF sparse vectors converges faster, generalises better on small
datasets, and produces well-calibrated probabilities — which is exactly
what predict_proba() needs for a meaningful trust score percentage.
RandomForest is included as a commented alternative.

CSV column contract (from startup_company_one_line_pitches.csv)
---------------------------------------------------------------
  One_Line_Pitch                  — text feature
  Funding_Stage                   — categorical: Pre-Seed | Seed | Series A/B/C/D | IPO
  Last_Funding_Amount_USD_Millions — numeric (may be NaN)
"""

import argparse
import os
import sys

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV = os.path.join(SCRIPT_DIR, "..", "startup_company_one_line_pitches.csv")
MODEL_OUT   = os.path.join(SCRIPT_DIR, "trust_score_model.pkl")

# ── Label logic ───────────────────────────────────────────────────────────────

# Funding stages that indicate a validated, high-quality company
HIGH_QUALITY_STAGES = {"Series A", "Series B", "Series C", "Series D", "IPO"}

# Minimum funding amount (USD millions) to qualify as high-quality
MIN_FUNDING_AMOUNT = 1.0


def create_label(row: pd.Series) -> int:
    """
    Binary quality label.

    Returns 1 (High Quality) if:
      - The company has reached a significant funding stage, OR
      - It has raised more than $1M (indicating external validation)
    Returns 0 (Low Quality / Unproven) otherwise.
    """
    stage  = str(row.get("Funding_Stage", "")).strip()
    amount = row.get("Last_Funding_Amount_USD_Millions")

    if stage in HIGH_QUALITY_STAGES:
        return 1

    try:
        if float(amount) > MIN_FUNDING_AMOUNT:
            return 1
    except (TypeError, ValueError):
        pass  # NaN or non-numeric — treat as low quality

    return 0


# ── Main ──────────────────────────────────────────────────────────────────────

def main(csv_path: str) -> None:
    # ── 1. Load data ──────────────────────────────────────────────────────────
    print(f"Loading data from: {csv_path}")
    df = pd.read_csv(csv_path)

    required_cols = {"One_Line_Pitch", "Funding_Stage"}
    missing = required_cols - set(df.columns)
    if missing:
        print(f"ERROR: CSV is missing required columns: {missing}")
        print(f"Available columns: {list(df.columns)}")
        sys.exit(1)

    # ── 2. Drop rows with no pitch text ───────────────────────────────────────
    before = len(df)
    df = df.dropna(subset=["One_Line_Pitch"])
    df = df[df["One_Line_Pitch"].str.strip().str.len() > 0]
    print(f"Rows after dropping empty pitches: {len(df)} (dropped {before - len(df)})")

    # ── 3. Create labels ──────────────────────────────────────────────────────
    df["y"] = df.apply(create_label, axis=1)

    label_counts = df["y"].value_counts()
    print(f"\nLabel distribution:")
    print(f"  High Quality (1): {label_counts.get(1, 0)}")
    print(f"  Low Quality  (0): {label_counts.get(0, 0)}")

    X = df["One_Line_Pitch"].tolist()
    y = df["y"].tolist()

    # ── 4. Train / test split ─────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain size: {len(X_train)}  |  Test size: {len(X_test)}")

    # ── 5. Build pipeline ─────────────────────────────────────────────────────
    #
    # TfidfVectorizer converts each pitch string into a sparse TF-IDF vector.
    # stop_words='english' removes common words (the, is, at…) that carry no
    # signal. max_features=3000 caps vocabulary size to prevent overfitting on
    # rare tokens.
    #
    # LogisticRegression with class_weight='balanced' compensates for any
    # class imbalance in the training data, ensuring the model doesn't just
    # predict the majority class.
    #
    # Alternative: replace LogisticRegression with:
    #   from sklearn.ensemble import RandomForestClassifier
    #   RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            stop_words="english",
            max_features=3000,
            ngram_range=(1, 2),   # unigrams + bigrams capture short phrases
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
        )),
    ])

    # ── 6. Fit ────────────────────────────────────────────────────────────────
    print("\nTraining pipeline...")
    pipeline.fit(X_train, y_train)

    # ── 7. Evaluate ───────────────────────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    print("\nClassification Report (test set):")
    print(classification_report(
        y_test, y_pred,
        target_names=["Low Quality (0)", "High Quality (1)"],
        zero_division=0,
    ))

    # ── 8. Save model ─────────────────────────────────────────────────────────
    joblib.dump(pipeline, MODEL_OUT)
    print(f"Model saved to: {MODEL_OUT}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train the SEPMS pitch trust/quality classifier."
    )
    parser.add_argument(
        "--csv",
        default=DEFAULT_CSV,
        help="Path to the startup pitches CSV file.",
    )
    args = parser.parse_args()
    main(args.csv)
