"""
Database Connection
====================
Manages the PostgreSQL connection pool using asyncpg.
asyncpg is async-native — meaning database queries won't freeze
the server while waiting, which is important for running
multiple browser agents at the same time.
"""

import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()  # reads values from the .env file

# The connection pool — shared across the whole app
_pool: asyncpg.Pool | None = None


async def connect_db():
    """Open the database connection pool. Called once at startup."""
    global _pool
    max_retries = 10
    retry_delay = 2

    for attempt in range(max_retries):
        try:
            db_url = os.getenv("DATABASE_URL")
            if db_url:
                _pool = await asyncpg.create_pool(
                    db_url,
                    min_size=5,
                    max_size=20,
                )
            else:
                _pool = await asyncpg.create_pool(
                    host=os.getenv("DB_HOST", "localhost"),
                    port=int(os.getenv("DB_PORT", "5432")),
                    user=os.getenv("DB_USER", "billsleeve"),
                    password=os.getenv("DB_PASSWORD", ""),
                    database=os.getenv("DB_NAME", "billsleeve"),
                    min_size=5,   # keep 5 connections warm (ready to use)
                    max_size=20,  # allow up to 20 simultaneous connections
                )
            print("✅ Connected to PostgreSQL")
            return
        except (ConnectionRefusedError, asyncpg.CannotConnectNowError) as e:
            if attempt == max_retries - 1:
                print(f"❌ Failed to connect to PostgreSQL after {max_retries} attempts")
                raise e
            print(f"⏳ PostgreSQL not ready yet (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay}s...")
            import asyncio
            await asyncio.sleep(retry_delay)


async def disconnect_db():
    """Close the pool cleanly when the server shuts down."""
    global _pool
    if _pool:
        await _pool.close()
        print("🔌 Database disconnected")


def get_db() -> asyncpg.Pool:
    """
    Returns the active connection pool.
    Call this anywhere you need to run a database query.

    Example usage in a service:
        pool = get_db()
        async with pool.acquire() as conn:
            result = await conn.fetch("SELECT * FROM bills WHERE user_id = $1", user_id)
    """
    if _pool is None:
        raise RuntimeError("Database not connected. Did connect_db() run?")
    return _pool
