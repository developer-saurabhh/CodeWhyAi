# CodeWhy AI — Backend (Python & FastAPI)

This directory contains the Python FastAPI backend for CodeWhy AI.

## Quick Setup Instructions

1. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Verify the server is running:**
   - Interactive Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
