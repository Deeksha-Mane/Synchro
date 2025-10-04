# config.py
from pydantic_settings import BaseSettings
from typing import Dict, List

class Settings(BaseSettings):
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "serviceAccountKey.json"
    FIREBASE_PROJECT_ID: str
    
    # Simulation
    NUM_VEHICLES: int = 900
    TICK_RATE_SECONDS: float = 0.5
    OVEN_PRODUCTION_RATE: int = 1
    MAX_CONVEYOR_PICK: int = 10
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG_MODE: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Color Distribution (production percentages)
COLOR_DISTRIBUTION = {
    'C1': 0.40, 'C2': 0.25, 'C3': 0.12, 'C4': 0.08,
    'C5': 0.03, 'C6': 0.02, 'C7': 0.02, 'C8': 0.02,
    'C9': 0.02, 'C10': 0.02, 'C11': 0.02, 'C12': 0.01
}

# Buffer Capacities
BUFFER_CAPACITY = {
    "L1": 14, "L2": 14, "L3": 14, "L4": 14,
    "L5": 16, "L6": 16, "L7": 16, "L8": 16, "L9": 16
}

# Dynamic Color-Volume Based Allocation Strategy
PREFERRED_BUFFERS = {
    # Oven 1 Zone (High-volume: C1, C2, C3)
    "C1": ["L1", "L2"],              # Dedicated L1, overflow to L2
    "C2": ["L3", "L2", "L4"],        # Prefer L3, flex L2, overflow L4
    "C3": ["L4", "L2"],              # L4 primary, L2 emergency
    
    # Oven 2 Zone (Medium/Low-volume: C4-C12)
    "C4": ["L5", "L9"],              # Paired with C5
    "C5": ["L5", "L9"],              # Paired with C4
    "C6": ["L6", "L9"],              # Paired with C7
    "C7": ["L6", "L9"],              # Paired with C6
    "C8": ["L7", "L9"],              # Paired with C9
    "C9": ["L7", "L9"],              # Paired with C8
    "C10": ["L8", "L9"],             # Paired with C11
    "C11": ["L8", "L9"],             # Paired with C10
    "C12": ["L9"]                    # Dedicated + emergency overflow
}

# Oven Primary Buffers (for separation logic)
OVEN_PRIMARY_BUFFERS = {
    "O1": ["L1", "L2", "L3", "L4"],
    "O2": ["L5", "L6", "L7", "L8", "L9"]
}

# Buffer Metadata
BUFFER_METADATA = {
    "L1": {"primary_colors": ["C1"], "is_flex": False, "oven": "O1"},
    "L2": {"primary_colors": ["C1", "C2"], "is_flex": True, "oven": "O1"},
    "L3": {"primary_colors": ["C2"], "is_flex": False, "oven": "O1"},
    "L4": {"primary_colors": ["C2", "C3"], "is_flex": True, "oven": "O1"},
    "L5": {"primary_colors": ["C4", "C5"], "is_flex": False, "oven": "O2"},
    "L6": {"primary_colors": ["C6", "C7"], "is_flex": False, "oven": "O2"},
    "L7": {"primary_colors": ["C8", "C9"], "is_flex": False, "oven": "O2"},
    "L8": {"primary_colors": ["C10", "C11"], "is_flex": False, "oven": "O2"},
    "L9": {"primary_colors": ["C12"], "is_flex": True, "oven": "O2"}
}

# Changeover Penalty Matrix (seconds)
CHANGEOVER_PENALTIES = {
    "same_color": 0,
    "base": 60,
    "high_volume": 30,    # Additional penalty for C1, C2, C3
    "large_batch": 20     # Additional penalty for breaking batches >5
}

HIGH_VOLUME_COLORS = ["C1", "C2", "C3"]
OCCUPANCY_THRESHOLD = 0.85  # 85% occupancy triggers strict color matching