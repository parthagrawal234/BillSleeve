"""
Bill Service
=============
Business logic for saving and fetching bills.
Sits between the API layer (handlers) and the database layer.

Think of it like: API → Service → Database
"""

import uuid
from datetime import datetime
from db.connect import get_db


async def save_bill_record(user_id: str, encrypted_path: str) -> dict:
    """
    Inserts a new bill record into the database.
    The image is already encrypted and saved to disk — we just record the path here.
    """
    pool = get_db()
    bill_id = str(uuid.uuid4())
    now = datetime.utcnow()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO bills (id, user_id, encrypted_path, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            bill_id, user_id, encrypted_path, now,
        )

    return {
        "id": bill_id,
        "user_id": user_id,
        "encrypted_path": encrypted_path,
        "created_at": now.isoformat(),
    }


async def fetch_bills(user_id: str) -> list[dict]:
    """Fetches all bills for a given user, newest first."""
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, user_id, store_name, total_amount, purchase_date, created_at
            FROM bills
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id,
        )
    # Convert each row to a plain dictionary
    return [dict(row) for row in rows]


async def fetch_bill_by_id(bill_id: str) -> dict | None:
    """Fetches a single bill by its ID. Returns None if not found."""
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, store_name, total_amount, purchase_date, encrypted_path, created_at
            FROM bills WHERE id = $1
            """,
            bill_id,
        )
    return dict(row) if row else None


async def update_bill_parsed_data(bill_id: str, store_name: str, total_amount: float, purchase_date: str):
    """
    After the vision pipeline parses a bill image, we update the record
    with the extracted data (store name, total, date).
    """
    pool = get_db()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE bills
            SET store_name = $1, total_amount = $2, purchase_date = $3
            WHERE id = $4
            """,
            store_name, total_amount, purchase_date, bill_id,
        )
