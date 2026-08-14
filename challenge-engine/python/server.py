from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Any

from registry import get_challenge_instance

app = FastAPI(title="CTF Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MethodCallRequest(BaseModel):
    seed: int = 1337
    method_name: str
    args: List[Any] = []


# ── 1. API Route ─────────────────────────────────────────────────────────────

@app.post("/api/challenge/{challenge_id}/call")
def call_method(challenge_id: str, req: MethodCallRequest):
    try:
        challenge = get_challenge_instance(challenge_id, req.seed)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found.")

    if req.method_name.startswith("_") or not hasattr(challenge, req.method_name):
        raise HTTPException(
            status_code=400,
            detail=f"Method '{req.method_name}' does not exist on challenge '{challenge_id}'."
        )

    method = getattr(challenge, req.method_name)
    if not callable(method):
        raise HTTPException(status_code=400, detail=f"Attribute '{req.method_name}' is not callable.")

    try:
        result = method(*req.args)
        if hasattr(result, "correct") and hasattr(result, "message"):
            return {"correct": result.correct, "message": result.message}
            
        if isinstance(result, bytes):
            result = result.hex()
        elif isinstance(result, dict):
            result = {k: (v.hex() if isinstance(v, bytes) else v) for k, v in result.items()}

        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")


# ── 2. Static Frontend Route ──────────────────────────────────────────────────

# `Path(__file__).resolve()` points to `.../Crypture/challenge-engine/python/server.py`
# .parent -> python/
# .parent -> challenge-engine/
# .parent -> Crypture/ (Project Root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_PATH = PROJECT_ROOT / "frontend" / "app"

if FRONTEND_PATH.exists():
    print(f"✅ Serving frontend files from: {FRONTEND_PATH}")
    app.mount("/", StaticFiles(directory=str(FRONTEND_PATH), html=True), name="static")
else:
    print(f"❌ Could not find frontend directory at: {FRONTEND_PATH}")
