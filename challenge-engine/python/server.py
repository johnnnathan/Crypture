from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Any
from pathlib import Path

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
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

# Mount static frontend directory at root '/'
# Adjust path relative to server.py location:
frontend_path = Path(__file__).parent.parent.parent / "frontend" / "app"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="static")
