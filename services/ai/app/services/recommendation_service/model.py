from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()

# 1. Load the Model 
# This converts text into a list of 384 numbers
model = SentenceTransformer('all-MiniLM-L6-v2')

class TextRequest(BaseModel):
    text: str

class TrainRequest(BaseModel):
    investor_vector: list[float] # The investor's current taste
    pitch_vector: list[float]    # The pitch they just saw
    action: str                  # "like" or "dislike"
