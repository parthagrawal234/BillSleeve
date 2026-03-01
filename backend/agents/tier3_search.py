"""
Tier 3 — Google Search Fallback
================================
When we don't know a brand's warranty page URL, we search for it.
The agent performs a real Google search (in the headless browser) and
follows the most likely result to the actual registration form.

This is the "last resort" — if a brand's warranty page is findable
by a human with Google, this agent can find it too.
"""

import logging
from playwright.async_api import Page

logger = logging.getLogger(__name__)

# Search query templates (tried in order)
SEARCH_QUERIES = [
    "{brand} {product} warranty registration",
    "{brand} product warranty register online",
    "{brand} warranty registration page",
    "{brand} register warranty serial number",
]

# Domains to prefer (brand's own site) and domains to skip
SKIP_DOMAINS = {
    "youtube.com", "facebook.com", "twitter.com", "instagram.com",
    "reddit.com", "amazon.com", "ebay.com", "yelp.com",
}


async def find_registration_page_via_search(
    page: Page, brand: str, product_name: str
) -> str | None:
    """
    Uses a headless browser to search Google for the brand's warranty
    registration page. Returns the best matching URL, or None.
    """
    for query_template in SEARCH_QUERIES:
        query = query_template.format(brand=brand, product=product_name)
        url = await _search_and_extract(page, query, brand)
        if url:
            logger.info(f"Tier 3: Found registration URL → {url}")
            return url

    logger.warning(f"Tier 3: No warranty registration page found for {brand}")
    return None


async def _search_and_extract(page: Page, query: str, brand: str) -> str | None:
    """Runs one Google search and returns the best result URL."""
    search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"

    try:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1500)  # let JS render results
    except Exception as e:
        logger.warning(f"Tier 3: Google search failed: {e}")
        return None

    # Handle Google's cookie consent popup (common in EU/India)
    try:
        consent_btn = page.locator("button:has-text('Accept all')").first
        if await consent_btn.is_visible(timeout=2000):
            await consent_btn.click()
            await page.wait_for_timeout(500)
    except Exception:
        pass

    # Extract all search result links
    links = await page.query_selector_all("a[href]")
    brand_lower = brand.lower().replace(" ", "")

    candidates = []
    for link in links:
        href = await link.get_attribute("href")
        if not href or not href.startswith("http"):
            continue

        # Skip ads, social media, and unrelated sites
        if any(skip in href for skip in SKIP_DOMAINS):
            continue
        if "/search?" in href or "google.com" in href:
            continue

        # Score the link based on relevance
        score = _score_url(href, brand_lower)
        if score > 0:
            candidates.append((score, href))

    if not candidates:
        return None

    # Return the highest-scoring URL
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def _score_url(url: str, brand_lower: str) -> int:
    """
    Scores a URL based on how likely it is to be the warranty registration page.
    Higher score = more relevant.
    """
    score = 0
    url_lower = url.lower()

    # Strong indicators — page is specifically for warranty registration
    if "warranty" in url_lower:      score += 10
    if "register" in url_lower:      score += 8
    if "registration" in url_lower:  score += 8
    if "product" in url_lower:       score += 3
    if "support" in url_lower:       score += 2
    if "service" in url_lower:       score += 2

    # Even better if it's the brand's own domain
    if brand_lower in url_lower:     score += 15

    # Penalize clearly wrong pages
    if "login" in url_lower:         score -= 5
    if "signin" in url_lower:        score -= 5
    if "cart" in url_lower:          score -= 10
    if "buy" in url_lower:           score -= 5

    return score
