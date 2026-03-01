"""
Bills API
==========
Endpoints for uploading and fetching bills.

KEY SECURITY PRINCIPLE — Zero Knowledge:
The mobile app encrypts the image BEFORE sending it here.
We store and serve the encrypted bytes without ever decrypting them.
The user's device is the only thing that can decrypt its own data.
"""

import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from services.bill_service import save_bill_record, fetch_bills, fetch_bill_by_id

router = APIRouter()

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")


@router.post("/upload", summary="Upload an encrypted bill image")
async def upload_bill(
    bill_image: UploadFile = File(..., description="AES-encrypted bill image from mobile app"),
    x_user_id: str = Header(..., description="User ID from the auth header"),
):
    """
    Receives an encrypted bill image from the Flutter app.
    Saves it to disk and creates a database record.
    The image is NEVER decrypted on the server — zero knowledge preserved.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-ID header")

    # Create a unique filename to avoid conflicts
    file_id = str(uuid.uuid4())
    filename = f"{x_user_id}_{file_id}.enc"  # .enc = encrypted
    file_path = os.path.join(STORAGE_PATH, filename)

    # Make sure the storage folder exists
    os.makedirs(STORAGE_PATH, exist_ok=True)

    # Save the encrypted file to disk asynchronously (doesn't block the server)
    async with aiofiles.open(file_path, "wb") as f:
        content = await bill_image.read()
        await f.write(content)

    # Create a record in the database
    bill = await save_bill_record(user_id=x_user_id, encrypted_path=file_path)

    return {"message": "Bill uploaded successfully", "bill": bill}


@router.get("/", summary="List all bills for a user")
async def list_bills(x_user_id: str = Header(...)):
    """Returns all bills belonging to the authenticated user."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-ID header")

    bills = await fetch_bills(user_id=x_user_id)
    return {"bills": bills}


@router.get("/{bill_id}", summary="Get a single bill by ID")
async def get_bill(bill_id: str, x_user_id: str = Header(...)):
    """Returns the details of a specific bill."""
    bill = await fetch_bill_by_id(bill_id=bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"bill": bill}
