# 🚀 INFINITE LOOP'S WEBSITE BACKEND

Welcome to the backend for **Infinite Loop group**! We're using **FastAPI** and **uv** to build the fastest deadline reminder system on the planet.

## 🛠️ Setup

### 1. Install uv
Run this if you dont have uv python package management on your system
```bash
curl -sSL https://astral.sh/uv/install.sh | sh
```

### 2. Install Dependencies
```bash
uv sync
```

### 3. Setup Secrets
```bash
cp .env.example .env
```

### 4. Run the Development Server
```bash
uv run uvicorn app.main:app --reload

