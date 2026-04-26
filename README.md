# 🚀 INFINITE LOOP'S WEBSITE BACKEND

Welcome to the backend for **Infinite Loop group**! We're using **FastAPI** and **uv** to build the fastest deadline reminder system on the planet.

## 🛠️ Setup

### 1. Install uv
Run this if you dont have uv python package management on your system
Linux
```bash
curl -sSL https://astral.sh/uv/install.sh | sh
```
Windows
```bash
pip install uv
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
```

## 🧪 Testing the API (Swagger UI)

Access the interactive documentation at `http://127.0.0.1:8000/docs`.

### 1. Account Creation
- Go to `POST /signup`.
- Click **Try it out**.
- Enter your email and password.
- Click **Execute**.

### 2. Authentication (The "Lock" Icon)
- Scroll to the top and click the green **Authorize** button.
- Enter the **Email** and **Password** you just registered.
- Click **Authorize**, then **Close**.
- *Note: This automatically handles the JWT Bearer token for all subsequent requests.*

### 3. Managing Tasks
- Go to `GET /tasks` or `POST /tasks`.
- Click **Try it out** and **Execute**.
- If you see a `200 OK` response, you are successfully authenticated!

