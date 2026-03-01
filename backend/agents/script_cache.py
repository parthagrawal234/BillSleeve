"""
Script Cache — Learning Storage
=================================
Saves successful agent scripts so they become permanent Tier 1 scripts.
Over time, BillSleeve "learns" more brands without any manual work.

HOW IT WORKS:
  After a Tier 2 or Tier 3 success, we save:
    - The URL where registration happened
    - The field selectors we found and filled
  Next time this brand comes up, load_cached_script() returns it
  and the main agent runs it as a fast Tier 1 script.

Storage: simple JSON files in backend/agents/tier1_scripts/
"""

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent / "tier1_scripts"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_path(brand: str) -> Path:
    """Returns the JSON file path for a brand's cached script."""
    safe_name = brand.lower().replace(" ", "_").replace("/", "_")
    return CACHE_DIR / f"{safe_name}.json"


def load_cached_script(brand: str) -> dict | None:
    """
    Loads a cached script for the given brand.
    Returns None if no script exists yet.
    """
    path = _cache_path(brand)
    if not path.exists():
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            script = json.load(f)
        logger.info(f"📂 Loaded cached script for {brand} (url: {script.get('url')})")
        return script
    except Exception as e:
        logger.warning(f"Failed to load cached script for {brand}: {e}")
        return None


def save_script_to_cache(brand: str, result) -> None:
    """
    Saves a successful agent result as a Tier 1 script.
    Called automatically after Tier 2 or Tier 3 success.
    """
    path = _cache_path(brand)

    script = {
        "brand":    brand,
        "url":      result.url,
        "tier_learned": result.tier_used,
        "fields":   getattr(result, "field_map", []),
    }

    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(script, f, indent=2)
        logger.info(f"💾 Saved Tier 1 script for {brand} → {path.name}")
    except Exception as e:
        logger.warning(f"Failed to save script for {brand}: {e}")


def list_known_brands() -> list[str]:
    """Returns all brands that have cached Tier 1 scripts."""
    return [p.stem.replace("_", " ").title() for p in CACHE_DIR.glob("*.json")]


def delete_cached_script(brand: str) -> bool:
    """Deletes a cached script (useful if a brand's website has changed)."""
    path = _cache_path(brand)
    if path.exists():
        path.unlink()
        logger.info(f"🗑️  Deleted cached script for {brand}")
        return True
    return False
