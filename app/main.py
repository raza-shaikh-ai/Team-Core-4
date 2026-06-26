from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, produce, requests, upload, stats, map_data, smart_match

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(produce.router)
app.include_router(requests.router)
app.include_router(upload.router)
app.include_router(stats.router)
app.include_router(map_data.router)
app.include_router(smart_match.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "message": "FarmShare API is running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
