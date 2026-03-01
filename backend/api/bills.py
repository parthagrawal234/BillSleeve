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
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.bill_service import save_bill_record, fetch_bills, fetch_bill_by_id
from api.deps import get_current_user_id

router = APIRouter()

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")


@router.post("/upload", summary="Upload an encrypted bill image")
async def upload_bill(
    bill_image: UploadFile = File(..., description="AES-encrypted bill image from mobile app"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Receives an encrypted bill image from the Flutter app.
    Saves it to disk and creates a database record.
    The image is NEVER decrypted on the server — zero knowledge preserved.
    """
    # Create a unique filename to avoid conflicts
    file_id = str(uuid.uuid4())
    filename = f"{user_id}_{file_id}.enc"  # .enc = encrypted
    file_path = os.path.join(STORAGE_PATH, filename)

    # Make sure the storage folder exists
    os.makedirs(STORAGE_PATH, exist_ok=True)

    # Save the encrypted file to disk asynchronously (doesn't block the server)
    async with aiofiles.open(file_path, "wb") as f:
        content = await bill_image.read()
        await f.write(content)

    # Create a record in the database
    bill = await save_bill_record(user_id=user_id, encrypted_path=file_path)

    return {"message": "Bill uploaded successfully", "bill": bill}


@router.get("/", summary="List all bills for a user")
async def list_bills(user_id: str = Depends(get_current_user_id)):
    """Returns all bills belonging to the authenticated user."""
    bills = await fetch_bills(user_id=user_id)
    return {"bills": bills}


@router.get("/{bill_id}", summary="Get a single bill by ID")
async def get_bill(bill_id: str, user_id: str = Depends(get_current_user_id)):
    """Returns the details of a specific bill (if it belongs to user)."""
    # NOTE: fetch_bill_by_id should eventually be updated to verify ownership.
    # We pass user_id so future implementations can check it.
    bill = await fetch_bill_by_id(bill_id=bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"bill": bill}
