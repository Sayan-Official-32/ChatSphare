#!/usr/bin/env python3
"""
ChatSphare CLI Orchestrator (run.py)
Cross-platform developer tooling to launch Backend and Frontend services.
"""

import sys
import os
import subprocess
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def get_python_executable():
    """Returns path to virtual environment python if available, otherwise system python."""
    # Check for Windows venv
    win_venv = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    if win_venv.exists():
        return str(win_venv)
    
    # Check for Unix venv
    unix_venv = BACKEND_DIR / ".venv" / "bin" / "python"
    if unix_venv.exists():
        return str(unix_venv)
        
    return sys.executable


def run_backend():
    """Runs the FastAPI ASGI server with auto-reload on port 8000."""
    print("🚀 [Backend] Launching FastAPI on http://127.0.0.1:8000...")
    py = get_python_executable()
    cmd = [
        py, "-m", "uvicorn", "app.main:app",
        "--reload",
        "--host", "127.0.0.1",
        "--port", "8000"
    ]
    return subprocess.Popen(cmd, cwd=str(BACKEND_DIR))


def run_frontend():
    """Runs the Vite development server on port 5173."""
    print("🌐 [Frontend] Launching Vite on http://localhost:5173...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    cmd = [npm_cmd, "run", "dev"]
    return subprocess.Popen(cmd, cwd=str(FRONTEND_DIR))


def run_dev():
    """Concurrently runs both backend and frontend."""
    print("🪐 Starting ChatSphare Full-Stack Development Services...")
    processes = []
    try:
        b_proc = run_backend()
        processes.append(b_proc)
        
        f_proc = run_frontend()
        processes.append(f_proc)
        
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down development servers...")
        for p in processes:
            p.terminate()
            try:
                p.wait(timeout=3)
            except subprocess.TimeoutExpired:
                p.kill()
        print("✅ Servers cleanly stopped.")


def main():
    if len(sys.argv) < 2:
        print("Usage: python run.py [backend|frontend|dev|build]")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "backend":
        proc = run_backend()
        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.terminate()
    elif command == "frontend":
        proc = run_frontend()
        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.terminate()
    elif command == "dev":
        run_dev()
    elif command == "build":
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        subprocess.run([npm_cmd, "run", "build"], cwd=str(FRONTEND_DIR))
    else:
        print(f"Unknown command: {command}")
        print("Available options: backend, frontend, dev, build")
        sys.exit(1)


if __name__ == "__main__":
    main()
