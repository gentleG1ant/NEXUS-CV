from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import internal_ai
import os
import secrets
from fastapi import Request
from fastapi.responses import JSONResponse

app = FastAPI(title="AI Resume Screening API", description="API for HR AI/ML Resume Screener")

# Enable CORS for React frontend (Port 5173 / 3000) and Java Gateway (Port 8080)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def require_internal_key(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    key = os.getenv("AI_SERVICE_KEY", "nexus-cv-default-local-ai-key")
    provided = request.headers.get("X-AI-Service-Key", "")
    if not key or not secrets.compare_digest(provided, key):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)

app.include_router(internal_ai.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
