from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import SETTINGS
from db.base import Base
from db.session import engine
from api.v1 import api_v1_router

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TebNegar MVP",
    description="AI-powered preliminary symptom assessment.",
    version="0.0.1"
)

app.include_router(api_v1_router.router, prefix="/api/v1")


# Setup CORS
origins = [
    "https://0ne-zero.github.io",
]

if SETTINGS.DEVELOPMENT:
    origins.append("null")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # domains allowed to make requests
    allow_credentials=True,         # whether to support cookies/auth
    allow_methods=["*"],            # HTTP methods allowed (GET, POST, etc.)
    allow_headers=["*"],            # HTTP headers allowed
)



@app.get("/", tags=["Root"])
def read_root():
    return {"message": f"Welcome to the TebNegar MVP API v{app.version}"}


import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True        # auto-reload on code changes (optional)
    )