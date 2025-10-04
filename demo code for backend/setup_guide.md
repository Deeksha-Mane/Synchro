# Smart Paint Shop Sequencing System - Complete Setup Guide

## 🎯 Overview

This system implements an optimized paint shop sequencing algorithm with:
- **FastAPI Backend** - High-performance scheduling engine
- **Firebase Firestore** - Real-time database
- **React Frontend** - Live visualization dashboard

---

## 📋 Prerequisites

1. **Python 3.9+** installed
2. **Node.js 16+** and npm/yarn
3. **Firebase Project** created
4. **Git** (optional)

---

## 🔥 Firebase Setup (15 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it: `paint-shop-sequencing`
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Firestore

1. In Firebase Console, click "Firestore Database"
2. Click "Create Database"
3. Choose "Start in **Production mode**"
4. Select your region (closest to you)
5. Click "Enable"

### Step 3: Create Service Account

1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file
5. Rename it to `serviceAccountKey.json`
6. **IMPORTANT**: Add to `.gitignore` (never commit this!)

### Step 4: Get Web Config

1. In Project Settings, scroll to "Your apps"
2. Click the **Web** icon `</>`
3. Register app name: `paint-shop-dashboard`
4. Copy the `firebaseConfig` object
5. Save this for frontend setup

---

## 🐍 Backend Setup (10 minutes)

### Step 1: Project Structure

Create the following structure:

```
smart-sequencing/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env
│   ├── serviceAccountKey.json  ← Place your Firebase key here
│   ├── models/
│   │   ├── __init__.py
│   │   └── vehicle.py
│   └── services/
│       ├── __init__.py
│       ├── scheduler.py
│       ├── simulation_engine.py
│       └── firestore_service.py
└── frontend/
    └── (React app)
```

### Step 2: Create Empty `__init__.py` Files

```bash
# In backend/
touch models/__init__.py
touch services/__init__.py
```

### Step 3: Install Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### Step 4: Configure Environment

Create `.env` file in `backend/` folder:

```env
# .env
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-i