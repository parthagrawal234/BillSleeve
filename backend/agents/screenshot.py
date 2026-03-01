"""
Screenshot Module — Proof of Registration
==========================================
After a successful (or failed) registration, take a screenshot
of the page and save it as evidence.

For successful registrations, this screenshot is the user's
permanent record that their warranty was registered.
"""

import logging
from pathlib import Path
from datetime import datetime
from playwright.async_api import Page

logger = logging.getLogger(__name__)

PROOF_DIR = Path("./storage/proofs")
PROOF_DIR.mkdir(parents=True, exist_ok=True)


async def take_proof_screenshot(page: Page, job_id: str) -> Path | None:
    """
    Takes a full-page screenshot and saves it with a timestamped filename.
    Returns the path to the saved file, or None if it failed.
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{job_id}_{timestamp}.png"
    filepath = PROOF_DIR / filename

    try:
        await page.screenshot(
            path=str(filepath),
            full_page=True,        # capture the entire page, not just viewport
            type="png",
        )
        logger.info(f"📸 Screenshot saved: {filepath.name}")
        return filepath
    except Exception as e:
        logger.warning(f"Screenshot failed for job {job_id}: {e}")
        return None
