"""
Warranties API
===============
Endpoints for viewing warranties and triggering the browser agent
to auto-register a warranty on a brand's website.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.warranty_service import get_warranties, dispatch_agent
from db.connect import get_db
from api.deps import get_current_user_id

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────
# Pydantic models auto-validate incoming JSON — no manual checking needed.

class WarrantyRegistrationRequest(BaseModel):
    warranty_id: str
    user_email: str  # needed to fill in registration forms on brand websites


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", summary="List all warranties for a user")
async def list_warranties(user_id: str = Depends(get_current_user_id)):
    """
    Returns all warranties with their product names, brands,
    expiry dates, and registration status.
    """
    warranties = await get_warranties(user_id=user_id)
    return {"warranties": warranties}


@router.post("/register", summary="Trigger browser agent to register a warranty")
async def register_warranty(req: WarrantyRegistrationRequest):
    """
    Launches a browser agent in the background to automatically
    register the warranty on the brand's website.

    Returns immediately with a job_id — the work happens async.
    You can poll the job status to check progress.
    """
    job_id = await dispatch_agent(
        warranty_id=req.warranty_id,
        user_email=req.user_email,
    )

    return {
        "status": "queued",
        "job_id": job_id,
        "message": "Browser agent dispatched. Check job status for updates.",
    }


@router.get("/jobs/{job_id}", summary="Check agent job status")
async def job_status(job_id: str):
    """
    Checks the status of a browser agent job.
    Status can be: queued | running | done | failed
    """
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT id, warranty_id, status, proof_path,
                      error_message, created_at, started_at, completed_at
               FROM agent_jobs WHERE id = $1""",
            job_id,
        )

    if not row:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return {
        "job_id":       row["id"],
        "warranty_id":  row["warranty_id"],
        "status":       row["status"],
        "proof_path":   row["proof_path"],
        "error":        row["error_message"],
        "created_at":   str(row["created_at"]),
        "completed_at": str(row["completed_at"]) if row["completed_at"] else None,
    }
