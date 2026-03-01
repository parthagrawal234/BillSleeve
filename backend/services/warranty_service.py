"""
Warranty Service
=================
Business logic for fetching warranties and dispatching browser agents.

The key feature here is asyncio.create_task() — when a user asks us
to register a warranty, we immediately return a job ID and run the
browser agent in the background. The user doesn't wait!
"""

import uuid
import asyncio
from datetime import datetime
from db.connect import get_db


async def get_warranties(user_id: str) -> list[dict]:
    """
    Fetches all warranties linked to bills owned by this user.
    Orders by expiry date (soonest first) so the user sees urgent ones first.
    """
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT w.id, w.bill_id, w.product_name, w.brand,
                   w.serial_no, w.expires_at, w.registered, w.created_at
            FROM warranties w
            JOIN bills b ON b.id = w.bill_id
            WHERE b.user_id = $1
            ORDER BY w.expires_at ASC NULLS LAST
            """,
            user_id,
        )
    return [dict(row) for row in rows]


async def dispatch_agent(warranty_id: str, user_email: str) -> str:
    """
    Dispatches a browser agent to register the warranty on the brand's website.

    IMPORTANT: This function returns IMMEDIATELY with a job_id.
    The actual browser agent runs in the background using asyncio.create_task().
    This is Python's equivalent of Go's goroutines — do many things at once!
    """
    job_id = str(uuid.uuid4())

    # Create a database record for this job
    await _create_job_record(job_id, warranty_id)

    # Launch the agent in the background — asyncio.create_task() is like
    # saying "start this work now, but don't wait for it to finish"
    asyncio.create_task(
        _run_agent_in_background(job_id, warranty_id, user_email)
    )

    print(f"🤖 Agent dispatched for warranty {warranty_id} (job: {job_id})")
    return job_id


async def _create_job_record(job_id: str, warranty_id: str):
    """Inserts a new agent job record with status 'queued'."""
    pool = get_db()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO agent_jobs (id, warranty_id, status, created_at)
            VALUES ($1, $2, 'queued', $3)
            """,
            job_id, warranty_id, datetime.utcnow(),
        )


async def _run_agent_in_background(job_id: str, warranty_id: str, user_email: str):
    """
    This runs in the background after dispatch_agent() returns.
    It will call into the agents/ module to do the actual browser automation.
    """
    pool = get_db()

    # Mark job as running
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE agent_jobs SET status = 'running', started_at = $1 WHERE id = $2",
            datetime.utcnow(), job_id,
        )

    try:
        # TODO: from agents.universal_agent import run_agent
        # result = await run_agent(warranty_id, user_email)
        print(f"✅ Agent job {job_id} completed (placeholder)")

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE agent_jobs SET status = 'done', completed_at = $1 WHERE id = $2",
                datetime.utcnow(), job_id,
            )

    except Exception as e:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE agent_jobs SET status = 'failed', error_message = $1, completed_at = $2 WHERE id = $3",
                str(e), datetime.utcnow(), job_id,
            )
        print(f"❌ Agent job {job_id} failed: {e}")
