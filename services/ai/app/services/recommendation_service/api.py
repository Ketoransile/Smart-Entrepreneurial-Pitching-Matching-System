from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from model import TextRequest, TrainRequest
from model import model,app
import numpy as np

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

# --- ENDPOINT 1: Turn Text into Vector ---
@app.post("/generate_embedding")
def generate_embedding(data: TextRequest):
    embedding = model.encode(data.text)
    return {"vector": embedding.tolist()}

# --- ENDPOINT 2: The Rocchio Algorithm (Training) ---
@app.post("/train_profile")
def train_profile(data: TrainRequest):
    # Convert lists to numpy arrays for math
    investor_vec = np.array(data.investor_vector)
    pitch_vec = np.array(data.pitch_vector)
    
    # PARAMETERS
    alpha = 1.0  # Keep old preferences weight
    beta = 0.4   # How much a "Like" adds to the profile (Learning Rate)
    gamma = 0.4  # How much a "Dislike" subtracts
    
    new_vector = investor_vec

    if data.action == "like":
        # Formula: Old + (0.4 * Pitch)
        new_vector = (alpha * investor_vec) + (beta * pitch_vec)
        print("Moving Investor Vector TOWARDS Pitch")
        
    elif data.action == "dislike":
        # Formula: Old - (0.4 * Pitch)
        new_vector = (alpha * investor_vec) - (gamma * pitch_vec)
        print("Moving Investor Vector AWAY FROM Pitch")

    # Normalize/ Crucial for Cosine Similarity in Mongo
    # This keeps the vector magnitude consistent (length = 1)
    norm = np.linalg.norm(new_vector)
    if norm > 0:
        new_vector = new_vector / norm
    
    return {"new_vector": new_vector.tolist()}