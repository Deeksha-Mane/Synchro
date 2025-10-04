# .env.template
# Copy this to .env and fill in your values

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id

# Simulation Settings
NUM_VEHICLES=900
TICK_RATE_SECONDS=0.5
OVEN_PRODUCTION_RATE=1
MAX_CONVEYOR_PICK=10

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=true

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173