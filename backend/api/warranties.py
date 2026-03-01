"""
Warranties API
===============
Endpoints for viewing warranties and triggering the browser agent
to auto-register a warranty on a brand's website.
"""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from services.warranty_service import get_warranties, dispatch_agent

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────
# Pydantic models auto-validate incoming JSON — no manual checking needed.

class WarrantyRegistrationRequest(BaseModel):
    warranty_id: str
    user_email: str  # needed to fill in registration forms on brand websites


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", summary="List all warranties for a user")
async def list_warranties(x_user_id: str = Header(...)):
    """
    Returns all warranties with their product names, brands,
    expiry dates, and registration status.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-ID header")

    warranties = await get_warranties(user_id=x_user_id)
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
    # TODO: query agent_jobs table by job_id
    return {
        "job_id": job_id,
        "status": "queued",  # placeholder until agents module is built
    }
