from fastapi import FastAPI
from api.v1.api_v1_router import api_v1_router
from db.base import Base
from db.session import engine

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TebNegar MVP",
    description="AI-powered preliminary symptom assessment.",
    version="0.0.1"
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the TebNegar MVP API"}


import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True        # auto-reload on code changes (optional)
    )