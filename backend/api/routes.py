"""
API Routes
===========
This is the "table of contents" for all the URLs in BillSleeve.
Each route points to a handler function that does the actual work.

FastAPI makes this beautiful — just add a decorator like @router.post("/path")
above any function and it becomes an API endpoint automatically.

Visit http://localhost:8080/docs when the server is running
to see and TEST all these endpoints in a visual interface (free!).
"""

from fastapi import APIRouter
from .bills import router as bills_router
from .warranties import router as warranties_router
from .vision import router as vision_router

# The main router that groups everything under /api
router = APIRouter()

# Attach sub-routers with their prefixes and tag groups
router.include_router(bills_router,      prefix="/bills",      tags=["Bills"])
router.include_router(warranties_router, prefix="/warranties", tags=["Warranties"])
router.include_router(vision_router,     prefix="/vision",     tags=["Vision / OCR"])
