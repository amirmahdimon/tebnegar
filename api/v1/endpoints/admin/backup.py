from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter()

@router.get("/download-db")
async def download_db():
    return FileResponse("tebnegar_mvp.db", filename="tebnegar_mvp.db")