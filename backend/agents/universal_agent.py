"""
Universal Browser Agent — Main State Machine
=============================================
This is the "brain" of the warranty registration system.
It uses a 3-tier fallback strategy to register warranties
on ANY company's website, not just pre-programmed ones.

HOW IT WORKS:
  Tier 1 → Check if we have a known, tested script for this brand
  Tier 2 → Use heuristics to find the registration form on their website
  Tier 3 → Google "BrandName warranty registration" and follow the top result

If Tier 2 or 3 succeeds, the selectors are cached so next time it's Tier 1 speed.

Each agent runs inside its own Playwright browser context — fully isolated.
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from playwright.async_api import async_playwright, Page, BrowserContext

from agents.tier2_heuristic import find_and_fill_form
from agents.tier3_search import find_registration_page_via_search
from agents.script_cache import load_cached_script, save_script_to_cache
from agents.screenshot import take_proof_screenshot

logger = logging.getLogger(__name__)

# Where proof screenshots are saved
PROOF_DIR = Path("./storage/proofs")
PROOF_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class WarrantyJob:
    """All the information an agent needs to register one warranty."""
    job_id: str
    brand: str             # e.g. "Sony", "Samsung", "Bosch"
    product_name: str      # e.g. "WH-1000XM5 Headphones"
    serial_no: str         # e.g. "SN123456789"
    purchase_date: str     # ISO format: "2026-01-15"
    user_email: str        # used to fill in registration forms
    user_name: str = ""    # optional — some forms ask for name


@dataclass
class AgentResult:
    """What the agent returns after attempting registration."""
    job_id: str
    success: bool
    tier_used: int         # 1, 2, or 3
    proof_path: str | None
    error: str | None
    url: str | None        # the page where registration was completed


async def run_warranty_agent(job: WarrantyJob) -> AgentResult:
    """
    Main entry point. Attempts warranty registration using the 3-tier system.
    Returns an AgentResult regardless of success or failure.
    """
    logger.info(f"🤖 Agent starting: job={job.job_id} brand={job.brand}")

    async with async_playwright() as pw:
        # Launch headless Chromium — "headless" means no visible window
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",  # hide bot detection
            ],
        )

        # Each job gets its own isolated browser context
        # (like a fresh incognito window — no cookies shared between jobs)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )

        try:
            result = await _run_with_tiers(context, job)
        except Exception as e:
            logger.error(f"❌ Agent crashed for job {job.job_id}: {e}")
            result = AgentResult(
                job_id=job.job_id,
                success=False, tier_used=0,
                proof_path=None, error=str(e), url=None,
            )
        finally:
            await context.close()
            await browser.close()

    return result


async def _run_with_tiers(context: BrowserContext, job: WarrantyJob) -> AgentResult:
    """Tries each tier in order, stopping at the first success."""
    page = await context.new_page()

    # ── TIER 1: Known brand script ──────────────────────────────────────────
    cached = load_cached_script(job.brand)
    if cached:
        logger.info(f"Tier 1: Using cached script for {job.brand}")
        try:
            result = await _execute_cached_script(page, job, cached)
            if result.success:
                return result
            logger.warning(f"Tier 1 script failed — falling back to Tier 2")
        except Exception as e:
            logger.warning(f"Tier 1 error: {e} — falling back to Tier 2")

    # ── TIER 2: Heuristic form finder ───────────────────────────────────────
    logger.info(f"Tier 2: Searching {job.brand}'s website for warranty form")
    try:
        website_url = f"https://www.{job.brand.lower().replace(' ', '')}.com/warranty"
        result = await find_and_fill_form(page, job, website_url)
        if result.success:
            # Cache this success so next time we use Tier 1
            save_script_to_cache(job.brand, result)
            return result
        logger.warning(f"Tier 2 failed for {job.brand} — falling back to Tier 3")
    except Exception as e:
        logger.warning(f"Tier 2 error: {e} — falling back to Tier 3")

    # ── TIER 3: Google search fallback ──────────────────────────────────────
    logger.info(f"Tier 3: Searching Google for '{job.brand} warranty registration'")
    try:
        reg_url = await find_registration_page_via_search(page, job.brand, job.product_name)
        if reg_url:
            result = await find_and_fill_form(page, job, reg_url)
            if result.success:
                save_script_to_cache(job.brand, result)
                return result
    except Exception as e:
        logger.error(f"Tier 3 error: {e}")

    return AgentResult(
        job_id=job.job_id, success=False, tier_used=3,
        proof_path=None,
        error=f"All 3 tiers failed for brand: {job.brand}",
        url=None,
    )


async def _execute_cached_script(page: Page, job: WarrantyJob, script: dict) -> AgentResult:
    """
    Replays a cached script (saved selectors + URL from a previous success).
    This is fast because we go directly to the form URL and fill known fields.
    """
    url = script["url"]
    fields = script["fields"]  # list of {selector, value_key} dicts

    await page.goto(url, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(1000)  # let JS settle

    job_data = {
        "serial_no": job.serial_no,
        "product_name": job.product_name,
        "purchase_date": job.purchase_date,
        "email": job.user_email,
        "name": job.user_name,
        "brand": job.brand,
    }

    # Fill each field using its saved selector
    for field in fields:
        selector = field["selector"]
        value = job_data.get(field["value_key"], "")
        if not value:
            continue
        try:
            await page.wait_for_selector(selector, timeout=5000)
            await page.fill(selector, value)
            await page.wait_for_timeout(200)  # small delay = more human-like
        except Exception:
            continue  # if a field is gone, skip it

    # Find and click the submit button
    submit = await _find_submit_button(page)
    if submit:
        await submit.click()
        await page.wait_for_load_state("networkidle", timeout=15000)

    # Take a screenshot as proof
    proof_path = await take_proof_screenshot(page, job.job_id)
    success = await _verify_success(page)

    return AgentResult(
        job_id=job.job_id,
        success=success,
        tier_used=1,
        proof_path=str(proof_path) if proof_path else None,
        error=None if success else "Submit appeared to fail (no success message detected)",
        url=page.url,
    )


async def _find_submit_button(page: Page):
    """Finds the form submit button using common patterns."""
    selectors = [
        "button[type='submit']",
        "input[type='submit']",
        "button:has-text('Register')",
        "button:has-text('Submit')",
        "button:has-text('Complete')",
        "button:has-text('Confirm')",
        "[data-testid*='submit']",
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if await btn.is_visible():
                return btn
        except Exception:
            continue
    return None


async def _verify_success(page: Page) -> bool:
    """
    Checks if the registration was successful by looking for
    typical success indicators on the page.
    """
    success_keywords = [
        "thank you", "registered", "success", "confirmation",
        "complete", "congratulations", "warranty activated",
        "registration complete",
    ]
    page_text = (await page.content()).lower()
    return any(kw in page_text for kw in success_keywords)
