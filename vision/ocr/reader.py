"""
OCR Reader — Multi-language Text Extraction
============================================
Uses Tesseract to extract text from a preprocessed image.

Tesseract supports 100+ languages. We use automatic language detection:
first try English, then widen to all installed language packs if confidence is low.

HOW TESSERACT WORKS (simplified):
  1. Finds text regions in the image
  2. For each character, compares against font pattern templates
  3. Returns the best-matching character + a confidence score (0–100)
"""

import pytesseract
import numpy as np
import cv2
import re
from typing import TypedDict

# ── Tesseract config ──────────────────────────────────────────────────────────
# PSM 6 = "Assume a single uniform block of text" — best for receipts
# OEM 3 = Use both legacy + LSTM engine (most accurate)
TESSERACT_CONFIG = "--psm 6 --oem 3"

# Languages to try, in order of preference.
# Tesseract language codes: https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html
# Install extra packs: https://github.com/tesseract-ocr/tessdata
LANGUAGE_PRIORITY = [
    "eng",          # English
    "eng+hin",      # English + Hindi
    "eng+ara",      # English + Arabic
    "eng+fra",      # English + French
    "eng+deu",      # English + German
    "eng+por",      # English + Portuguese
    "eng+spa",      # English + Spanish
    "eng+rus",      # English + Russian
    "eng+chi_sim",  # English + Simplified Chinese
    "eng+jpn",      # English + Japanese
]


class OcrResult(TypedDict):
    text: str
    language: str
    confidence: float


def extract_text(image: np.ndarray) -> OcrResult:
    """
    Runs Tesseract OCR on a preprocessed image.
    Auto-detects language by trying multiple packs and picking the highest confidence.

    Args:
        image: A grayscale NumPy array (output from preprocessor)

    Returns:
        OcrResult with raw text, detected language code, and confidence (0.0 – 1.0)
    """
    best_result: OcrResult = {"text": "", "language": "eng", "confidence": 0.0}

    for lang in LANGUAGE_PRIORITY:
        try:
            # Get detailed OCR data including per-word confidence scores
            data = pytesseract.image_to_data(
                image,
                lang=lang,
                config=TESSERACT_CONFIG,
                output_type=pytesseract.Output.DICT,
            )

            # Filter out words with confidence = -1 (blank / unrecognized)
            confidences = [c for c in data["conf"] if c != -1]
            if not confidences:
                continue

            avg_confidence = sum(confidences) / len(confidences) / 100.0  # normalize to 0–1

            # Reconstruct the full text from per-word data
            text = _reconstruct_text(data)

            if avg_confidence > best_result["confidence"]:
                best_result = {
                    "text": text,
                    "language": lang,
                    "confidence": round(avg_confidence, 3),
                }

            # If confidence is already excellent (>85%), stop searching
            if avg_confidence > 0.85:
                break

        except pytesseract.TesseractNotFoundError:
            raise RuntimeError(
                "Tesseract is not installed or not in PATH.\n"
                "Download from: https://github.com/UB-Mannheim/tesseract/wiki\n"
                "Then add it to your system PATH."
            )
        except Exception:
            # Language pack not installed — skip and try next
            continue

    return best_result


def _reconstruct_text(data: dict) -> str:
    """
    Rebuilds readable text from Tesseract's word-by-word output.
    Preserves line breaks which are critical for parsing prices
    (prices are usually at the end of a line, after the item name).
    """
    lines = []
    current_line = []
    current_line_num = -1

    for i, word in enumerate(data["text"]):
        word = word.strip()
        if not word:
            continue

        line_num = data["line_num"][i]

        # New line detected
        if line_num != current_line_num:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            current_line_num = line_num
        else:
            current_line.append(word)

    if current_line:
        lines.append(" ".join(current_line))

    return "\n".join(lines)
