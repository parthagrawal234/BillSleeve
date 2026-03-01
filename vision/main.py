"""
BillSleeve Vision Service — Entry Point
=========================================
This is a standalone microservice that runs on port 5001.
The FastAPI backend calls this to process bill images.

Start it with:
    python main.py
or
    uvicorn main:app --port 5001 --reload
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import io
from PIL import Image

from preprocessing.cleaner import preprocess_image
from ocr.reader import extract_text
from parser.extractor import parse_bill_text

app = FastAPI(
    title="BillSleeve Vision Service",
    description="Cleans bill images, extracts text via OCR, parses structured data",
    version="1.0.0",
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "BillSleeve Vision"}


@app.post("/parse")
async def parse_bill(image: UploadFile = File(...)):
    """
    Main endpoint: receive a bill image, return structured JSON.

    Pipeline:
        1. Preprocess  — OpenCV cleans the image
        2. OCR         — Tesseract reads the text (multi-language)  
        3. Parse       — Regex extracts price, date, store, warranties

    Returns:
        {
          "store_name": "Walmart",
          "total_amount": 45.99,
          "purchase_date": "2026-01-15",
          "language": "eng",
          "items": [...],
          "confidence": 0.87
        }
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read the uploaded image bytes
    image_bytes = await image.read()

    try:
        # Step 1: Clean the image with OpenCV
        cleaned_image = preprocess_image(image_bytes)

        # Step 2: Extract raw text with Tesseract OCR
        ocr_result = extract_text(cleaned_image)

        # Step 3: Parse the raw text into structured data
        parsed = parse_bill_text(ocr_result["text"], ocr_result["language"])

        return {
            "store_name":    parsed["store_name"],
            "total_amount":  parsed["total_amount"],
            "purchase_date": parsed["purchase_date"],
            "items":         parsed["items"],
            "language":      ocr_result["language"],
            "confidence":    ocr_result["confidence"],
            "raw_text":      ocr_result["text"],  # useful for debugging
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision pipeline error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
