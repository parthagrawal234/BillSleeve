"""
BillSleeve Backend — Entry Point
=================================
This is where the server starts. Run it with:
    uvicorn main:app --reload --port 8080

Think of this like the "front door" of the building.
Everything connects here: database, routes, startup logic.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.connect import connect_db, disconnect_db
from api.routes import router
from api import auth


# ── Lifespan (runs on startup & shutdown) ────────────────────────────────────
# This is like "open the shop" and "close the shop" logic.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: connect to database
    await connect_db()
    print("🚀 BillSleeve backend is running!")
    yield
    # On shutdown: close connection cleanly
    await disconnect_db()
    print("🔌 BillSleeve backend shut down.")


# ── Create the App ───────────────────────────────────────────────────────────
app = FastAPI(
    title="BillSleeve API",
    description="Offline bill management with automatic warranty registration",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow requests from the Next.js dashboard and Flutter web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow mobile and Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes (API endpoints)
app.include_router(auth.router, prefix="/api")
app.include_router(router, prefix="/api")


# ── Quick health check ───────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    """Quick check to see if the server is alive."""
    return {"status": "ok", "service": "BillSleeve Backend"}
