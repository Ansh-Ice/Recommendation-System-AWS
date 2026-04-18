"""Central configuration values for the Flask backend."""

from pathlib import Path

# Resolve paths relative to this file so deployment works from any working directory.
BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = BASE_DIR / "artifacts"

MOVIES_PATH = ARTIFACTS_DIR / "movies.pkl"
SIMILARITY_PATH = ARTIFACTS_DIR / "similarity.pkl"

HOST = "0.0.0.0"
PORT = 5000
