"""
Tier 2 — Heuristic Form Finder
================================
When we don't have a stored script for a brand, this module
visits their website and tries to find the warranty registration
form by looking for common patterns all forms share.

APPROACH:
  1. Go to the brand's warranty URL
  2. Scan all <input>, <select>, <textarea> fields on the page
  3. Match fields to their purpose using label text + name attributes
  4. Fill the matched fields with the job data
  5. Submit and check for a success message
"""

import re
import logging
from dataclasses import dataclass
from playwright.async_api import Page

logger = logging.getLogger(__name__)

# Keywords that suggest a field is for each data type
FIELD_HINTS = {
    "serial_no": [
        "serial", "serial_no", "serialnumber", "serial number",
        "model number", "product code", "product_code",
    ],
    "product_name": [
        "product", "product name", "product_name", "model",
        "model name", "item", "device",
    ],
    "purchase_date": [
        "purchase date", "date of purchase", "buy date",
        "purchase_date", "purchasedate", "date bought",
    ],
    "email": [
        "email", "e-mail", "email address", "emailaddress",
        "mail",
    ],
    "name": [
        "name", "full name", "fullname", "customer name",
        "first name", "last name",
    ],
}


async def find_and_fill_form(page: Page, job, url: str):
    """
    Navigates to the given URL and attempts to fill the warranty
    registration form using heuristic field matching.
    """
    from agents.universal_agent import AgentResult
    from agents.screenshot import take_proof_screenshot

    logger.info(f"Tier 2: navigating to {url}")

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)  # let JavaScript render the form
    except Exception as e:
        return AgentResult(
            job_id=job.job_id, success=False, tier_used=2,
            proof_path=None, error=f"Failed to load {url}: {e}", url=url,
        )

    # Find all input fields on the page
    fields_filled = await _fill_form_fields(page, job)

    if fields_filled == 0:
        # No fillable fields found — this isn't a form page
        return AgentResult(
            job_id=job.job_id, success=False, tier_used=2,
            proof_path=None,
            error="No recognizable form fields found on the page",
            url=page.url,
        )

    logger.info(f"Tier 2: filled {fields_filled} fields, attempting submit")

    # Find and click the submit button
    submitted = await _submit_form(page)
    if not submitted:
        return AgentResult(
            job_id=job.job_id, success=False, tier_used=2,
            proof_path=None, error="Could not find submit button", url=page.url,
        )

    # Wait for the response
    await page.wait_for_load_state("networkidle", timeout=15000)

    # Check for success
    proof_path = await take_proof_screenshot(page, job.job_id)
    success = await _check_success_page(page)

    # Build the field map for caching (what we found and filled)
    field_map = await _build_field_map(page, job)

    result = AgentResult(
        job_id=job.job_id,
        success=success,
        tier_used=2,
        proof_path=str(proof_path) if proof_path else None,
        error=None if success else "No success confirmation detected",
        url=page.url,
    )
    # Attach field map for caching (used by script_cache.py)
    result.field_map = field_map  # type: ignore
    return result


async def _fill_form_fields(page: Page, job) -> int:
    """
    Scans the page for input fields and fills them using label/name matching.
    Returns the number of fields successfully filled.
    """
    job_data = {
        "serial_no":    job.serial_no,
        "product_name": job.product_name,
        "purchase_date": job.purchase_date,
        "email":        job.user_email,
        "name":         job.user_name,
    }

    # Get all visible input/select/textarea elements
    inputs = await page.query_selector_all(
        "input:not([type='hidden']):not([type='submit']):not([type='button']), "
        "select, textarea"
    )

    filled = 0
    for element in inputs:
        # Get identifying attributes from the element
        elem_id    = (await element.get_attribute("id") or "").lower()
        elem_name  = (await element.get_attribute("name") or "").lower()
        elem_placeholder = (await element.get_attribute("placeholder") or "").lower()
        elem_type  = (await element.get_attribute("type") or "text").lower()

        # Get the label text associated with this input
        label_text = await _get_label_text(page, elem_id)

        # Combine all hints into one searchable string
        hint_str = f"{elem_id} {elem_name} {elem_placeholder} {label_text}".lower()

        # Skip password and unrelated fields
        if elem_type in ("password", "checkbox", "radio"):
            continue

        # Match the field to a job data key
        matched_key = _match_field(hint_str)
        if not matched_key:
            continue

        value = job_data.get(matched_key, "")
        if not value:
            continue

        try:
            # For select dropdowns, try to find a matching option
            tag = await element.evaluate("el => el.tagName.toLowerCase()")
            if tag == "select":
                await _select_matching_option(element, value)
            else:
                await element.fill(value)
                await page.wait_for_timeout(150)  # human-like pause
            filled += 1
            logger.debug(f"  ✅ Filled '{matched_key}' in [{elem_name or elem_id}]")
        except Exception as e:
            logger.debug(f"  ⚠️  Couldn't fill [{elem_name or elem_id}]: {e}")

    return filled


async def _get_label_text(page: Page, input_id: str) -> str:
    """Finds the label element associated with an input by its ID."""
    if not input_id:
        return ""
    try:
        label = await page.query_selector(f"label[for='{input_id}']")
        if label:
            return (await label.inner_text()).strip().lower()
    except Exception:
        pass
    return ""


def _match_field(hint_str: str) -> str | None:
    """Returns the job data key that best matches the hint string."""
    for data_key, keywords in FIELD_HINTS.items():
        for kw in keywords:
            if kw in hint_str:
                return data_key
    return None


async def _select_matching_option(element, value: str):
    """For <select> dropdowns, picks the option closest to the target value."""
    options = await element.query_selector_all("option")
    value_lower = value.lower()
    for option in options:
        option_text = (await option.inner_text()).lower()
        if value_lower in option_text or option_text in value_lower:
            option_value = await option.get_attribute("value")
            await element.select_option(value=option_value)
            return


async def _submit_form(page: Page) -> bool:
    """Finds and clicks the submit/register button."""
    selectors = [
        "button[type='submit']",
        "input[type='submit']",
        "button:has-text('Register')",
        "button:has-text('Submit')",
        "button:has-text('Complete Registration')",
        "button:has-text('Activate Warranty')",
        "[class*='submit']",
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if await btn.is_visible():
                await btn.click()
                return True
        except Exception:
            continue
    return False


async def _check_success_page(page: Page) -> bool:
    """Checks for common success indicators in the page content."""
    keywords = [
        "thank you", "success", "registered successfully",
        "warranty registered", "confirmation", "complete",
        "congratulations", "activated",
    ]
    content = (await page.content()).lower()
    return any(kw in content for kw in keywords)


async def _build_field_map(page: Page, job) -> list[dict]:
    """
    Builds a list of {selector, value_key} pairs from what was filled.
    This is saved to cache so future runs can replay the same actions.
    """
    # Simplified: return selector patterns that worked
    # In a full implementation this would record exact selectors per field
    return [
        {"selector": "input[name*='serial']", "value_key": "serial_no"},
        {"selector": "input[name*='email']",  "value_key": "email"},
        {"selector": "input[name*='product']","value_key": "product_name"},
        {"selector": "input[name*='date']",   "value_key": "purchase_date"},
    ]
