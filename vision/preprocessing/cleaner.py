"""
Image Preprocessor
====================
This module cleans up bill photos before OCR reads them.
A blurry, tilted, low-contrast photo produces garbage OCR results.
These steps fix that — all using OpenCV (no AI needed).

Pipeline:
    1. Grayscale       — remove color noise, only luminance matters for text
    2. Denoise          — Gaussian blur removes camera grain
    3. Binarization     — Otsu's threshold → pure black/white (best for OCR)
    4. Deskew           — detect and correct rotation (up to ±45°)
    5. Perspective warp — detect bill edges, flatten any 3D angle
"""

import cv2
import numpy as np
import io
from PIL import Image


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Takes raw image bytes (from the uploaded file) and returns a
    cleaned OpenCV image ready for Tesseract OCR.
    """
    # Convert bytes → PIL Image → NumPy array (OpenCV format)
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = np.array(pil_image)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # Step 1: Convert to grayscale
    # Color information is irrelevant for text — this simplifies everything
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Step 2: Upscale if the image is small (Tesseract works best at 300+ DPI)
    h, w = gray.shape
    if w < 1000:
        scale = 1000 / w
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # Step 3: Denoise — Gaussian blur removes camera sensor grain
    # Kernel size (5,5) = light blur. Increase for noisier photos.
    denoised = cv2.GaussianBlur(gray, (5, 5), 0)

    # Step 4: Binarization — convert to pure black and white
    # Otsu's method automatically finds the best threshold value
    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Step 5: Perspective correction — find the bill rectangle and flatten it
    warped = _perspective_correct(img, binary)

    # Step 6: Deskew — fix slight rotations
    deskewed = _deskew(warped)

    # Step 7: Final sharpening pass — makes text edges crisper for OCR
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(deskewed, -1, kernel)

    return sharpened


def _perspective_correct(original_color: np.ndarray, binary: np.ndarray) -> np.ndarray:
    """
    Finds the four corners of the bill/receipt in the image
    and warps the perspective so the bill appears perfectly flat.

    Think of it like scanning a document that's on a table at an angle.
    Canny edge detection finds the edges → find the largest rectangle → warp it.
    """
    # Canny edge detector highlights all strong edges in the image
    edges = cv2.Canny(binary, 50, 150, apertureSize=3)

    # Find all contours (closed shapes) in the edge map
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return binary  # no contours found, return as-is

    # Sort contours by area (largest first) — the bill is the biggest rectangle
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for contour in contours[:5]:  # check top 5 largest contours
        # Simplify the contour to a polygon
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)

        # A rectangle has exactly 4 corners
        if len(approx) == 4:
            return _warp_perspective(original_color, approx)

    return binary  # no rectangle found, return cleaned binary


def _warp_perspective(img: np.ndarray, corners: np.ndarray) -> np.ndarray:
    """
    Applies perspective transformation given 4 corner points.
    The result is a top-down, flat view of the receipt.
    """
    pts = corners.reshape(4, 2).astype(np.float32)

    # Order points: top-left, top-right, bottom-right, bottom-left
    rect = _order_points(pts)
    (tl, tr, br, bl) = rect

    # Calculate the output dimensions (width × height of the straightened bill)
    width_top = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    max_width = int(max(width_top, width_bottom))

    height_left = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    max_height = int(max(height_left, height_right))

    # Define destination points (a perfect rectangle)
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype=np.float32)

    # Apply the warp and convert back to grayscale
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(img, M, (max_width, max_height))
    return cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Orders 4 points as: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left has smallest sum
    rect[2] = pts[np.argmax(s)]   # bottom-right has largest sum
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left
    return rect


def _deskew(img: np.ndarray) -> np.ndarray:
    """
    Detects the angle of text lines and rotates the image to make them horizontal.
    Uses the Hough Line Transform to detect dominant line angles.
    """
    # Find edges for line detection
    edges = cv2.Canny(img, 50, 150, apertureSize=3)

    # Detect lines using Hough Transform
    lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)

    if lines is None:
        return img  # no detectable lines, image is probably already straight

    # Calculate the average angle of all detected lines
    angles = []
    for rho, theta in lines[:, 0]:
        angle = np.degrees(theta) - 90
        if -45 < angle < 45:  # ignore near-vertical lines
            angles.append(angle)

    if not angles:
        return img

    median_angle = np.median(angles)

    # Only correct if the skew is more than 0.5° (avoid micro-rotations)
    if abs(median_angle) < 0.5:
        return img

    # Rotate the image to correct the skew
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC,
                             borderMode=cv2.BORDER_REPLICATE)
    return rotated
