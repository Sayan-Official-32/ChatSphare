# 🏁 ChatSphare: Getting Started & Developer Onboarding

> **Target Audience:** Developers setting up ChatSphare locally for the first time.  
> **Repository Context:** `C:\Users\ASUS\OneDrive\Documents\VSCODE\chatsphare`  

---

## 1. Local Environment Prerequisites

Verify that your system has the following runtimes installed:

* **Python 3.11+**: Check with `python --version`
* **Node.js 18+ or 20+ LTS**: Check with `node --version`
* **NPM 9+**: Check with `npm --version`
* **Git**: Check with `git --version`

---

## 2. Step-by-Step Setup Instructions

### Step 1: Clone or Navigate to the Workspace
```bash
cd C:\Users\ASUS\OneDrive\Documents\VSCODE\chatsphare
```

### Step 2: Environment Configuration
Copy the `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
# Windows PowerShell:
# Copy-Item .env.example .env
```
Fill in the following essential variables:
* `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from your Supabase project dashboard).
* `MISTRAL_API_KEY` (or `GEMINI_API_KEY`).
* `FIREBASE_PROJECT_ID`.

### Step 3: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows Command Prompt:
# .venv\Scripts\activate.bat
# Linux / macOS:
# source .venv/bin/activate

# Install backend dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright Chromium headless browser binaries
python -m playwright install --with-deps chromium

cd ..
```

### Step 4: Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

cd ..
```

### Step 5: Database Schema Migration
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Enable the `vector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Run the schema migrations from `backend/migrations/` (see `markdown/Development_From_Scratch.md` for the full SQL schema).

---

## 3. Running the Development Servers

ChatSphare includes a unified CLI runner (`run.py`):

```bash
# Concurrently launch both backend (port 8000) and frontend (port 5173):
python run.py dev
```

### Individual Service Commands:
* **Backend Only:** `python run.py backend` (Runs Uvicorn at `http://127.0.0.1:8000` with reload)
* **Frontend Only:** `python run.py frontend` (Runs Vite at `http://localhost:5173`)
* **Build Frontend:** `python run.py build`
* **Production Emulation:** `python run.py prod`

---

## 4. Key Endpoints to Verify

Once the servers are running:
* **Frontend Web Application:** [`http://localhost:5173`](http://localhost:5173)
* **Backend Health Check:** [`http://127.0.0.1:8000/api/health`](http://127.0.0.1:8000/api/health)
* **Interactive OpenAPI Swagger Docs:** [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
* **ReDoc API Specification:** [`http://127.0.0.1:8000/redoc`](http://127.0.0.1:8000/redoc)
