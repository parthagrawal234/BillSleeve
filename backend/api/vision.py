"""
Vision API
===========
Forwards images to the Python OCR microservice (vision/ folder)
and returns structured bill data as JSON.

The vision microservice runs on port 5001.
This backend acts as the middleman between the mobile app and the OCR engine.
"""

import httpx
import os
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

VISION_URL = os.getenv("VISION_SERVICE_URL", "http://localhost:5001")


@router.post("/parse", summary="Parse a bill image using OCR")
async def parse_image(image: UploadFile = File(...)):
    """
    Sends a bill image to the vision microservice.
    Returns structured data: store name, total, date, line items, language.

    The vision service uses OpenCV + Tesseract under the hood.
    """
    image_bytes = await image.read()

    # Forward the image to the Python vision microservice
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{VISION_URL}/parse",
                files={"image": (image.filename, image_bytes, image.content_type)},
            )
            response.raise_for_status()
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail="Vision service is not running. Start vision/main.py first.",
            )
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Vision service error: {e.response.text}",
            )

    return response.json()
