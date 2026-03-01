"""
Bill Text Parser — Heuristic Regex Extractor
=============================================
Takes raw OCR text and extracts structured data using only
regex patterns and keyword heuristics — no AI required.

PHILOSOPHY:
  Bills have very predictable structure:
  - Store name is at the TOP
  - Total is near the BOTTOM, preceded by "Total", "Amount Due", etc.
  - Dates follow known formats (DD/MM/YYYY, MM-DD-YY, etc.)
  - Items are in the MIDDLE, each line: [Name]  [Price]
  - Warranties appear as "2 Year Warranty", "Limited 1 Yr", etc.
"""

import re
from datetime import datetime
from typing import TypedDict


class ParsedItem(TypedDict):
    name: str
    price: float
    warranty: str | None


class ParsedBill(TypedDict):
    store_name: str | None
    total_amount: float | None
    purchase_date: str | None
    items: list[ParsedItem]


# ── Regex Patterns ────────────────────────────────────────────────────────────

# Matches prices: $45.99 / ₹299 / €12.50 / 45.99 / 1,299.00
_PRICE_PATTERN = re.compile(
    r"(?:[$€£₹¥₩])\s*(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)"
    r"|(\d{1,3}(?:[,]\d{3})*\.\d{2})"
)

# Matches lines containing total keywords
_TOTAL_KEYWORDS = re.compile(
    r"\b(grand\s*total|total\s*due|amount\s*due|total\s*amount|subtotal|total|balance|net\s*payable)\b",
    re.IGNORECASE,
)

# Matches various date formats
_DATE_PATTERNS = [
    (r"\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b", "%d/%m/%Y"),  # DD/MM/YYYY
    (r"\b(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})\b", "%Y/%m/%d"),  # YYYY/MM/DD
    (r"\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})\b",  "%d/%m/%y"), # DD/MM/YY
    (r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b", "%d %b %Y"),
    (r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})\b", "%b %d %Y"),
]

# Matches warranty mentions
_WARRANTY_PATTERN = re.compile(
    r"(\d+)\s*[-]?\s*(year|yr|month|mo|day)s?\s*(limited|extended|warranty|guarantee|warr\.?)?",
    re.IGNORECASE,
)

# Common store name indicators (found in first few lines)
_STORE_INDICATORS = re.compile(
    r"\b(inc\.?|ltd\.?|llc\.?|corp\.?|store|market|mart|shop|supermarket|outlet|retail)\b",
    re.IGNORECASE,
)


def parse_bill_text(raw_text: str, language: str = "eng") -> ParsedBill:
    """
    Main parser function. Takes raw OCR text, returns structured bill data.

    Strategy:
      - Store name  → first non-empty line (usually the header)
      - Total       → scan from bottom, find "Total" keyword + nearby price
      - Date        → scan all lines for date patterns
      - Items       → lines in the middle with a name + price on the same line
      - Warranties  → any line matching warranty duration patterns
    """
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

    store_name   = _extract_store_name(lines)
    total_amount = _extract_total(lines)
    purchase_date = _extract_date(lines)
    items        = _extract_items(lines)

    return {
        "store_name":    store_name,
        "total_amount":  total_amount,
        "purchase_date": purchase_date,
        "items":         items,
    }


# ── Individual extractors ─────────────────────────────────────────────────────

def _extract_store_name(lines: list[str]) -> str | None:
    """
    Store name is almost always the first 1–3 lines of a receipt.
    We pick the first line that looks like a name (not a number or address).
    """
    for line in lines[:5]:
        # Skip lines that are purely numeric, addresses, or dates
        if re.match(r"^[\d\s\W]+$", line):
            continue
        if re.match(r"^\d+\s+\w+\s+(st|ave|rd|blvd|ln|dr|way)\.?", line, re.IGNORECASE):
            continue
        # Skip single-word lines that are just "RECEIPT" or "INVOICE"
        if line.upper() in {"RECEIPT", "INVOICE", "BILL", "TAX INVOICE"}:
            continue
        return line.title()  # capitalize properly e.g. "WALMART" → "Walmart"

    return None


def _extract_total(lines: list[str]) -> float | None:
    """
    Searches from the BOTTOM of the receipt for a "Total" keyword
    and extracts the adjacent price.
    Total is always at the bottom — that's the convention on all receipts.
    """
    # Search bottom third of the document first (most likely location)
    search_lines = lines[len(lines) // 2:][::-1]  # reversed = bottom-up

    for i, line in enumerate(search_lines):
        if _TOTAL_KEYWORDS.search(line):
            # Try to extract a price from this line first
            price = _parse_price(line)
            if price:
                return price
            # If not on same line, check the next line (price may be on next line)
            if i + 1 < len(search_lines):
                price = _parse_price(search_lines[i + 1])
                if price:
                    return price

    # Fallback: return the largest price found anywhere in the document
    prices = []
    for line in lines:
        p = _parse_price(line)
        if p:
            prices.append(p)

    return max(prices) if prices else None


def _extract_date(lines: list[str]) -> str | None:
    """Scans all lines for recognizable date patterns."""
    full_text = " ".join(lines)

    for pattern_str, fmt in _DATE_PATTERNS:
        match = re.search(pattern_str, full_text, re.IGNORECASE)
        if match:
            try:
                groups = match.groups()
                date_str = "/".join(groups)
                # Normalize to YYYY-MM-DD ISO format
                if "b" in fmt.lower():  # month name format
                    raw = " ".join(groups)
                    parsed_date = datetime.strptime(raw, fmt.replace("/", " ").replace("%d/%m/%Y", "%d %b %Y"))
                else:
                    from_pattern = fmt.replace("%Y", "%Y").replace("%m", "%m").replace("%d", "%d")
                    parsed_date = datetime.strptime(date_str, from_pattern)
                return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue

    return None


def _extract_items(lines: list[str]) -> list[ParsedItem]:
    """
    Extracts line items — middle portion of the receipt.
    Each item line typically has: [Product Name]  [Price]
    We skip the header (first 3 lines) and footer totals (last 5 lines).
    """
    items = []
    body_lines = lines[3:-5] if len(lines) > 8 else lines

    for line in body_lines:
        # Skip lines that look like dividers, totals, or section headers
        if re.match(r"^[=\-\*]+$", line):
            continue
        if _TOTAL_KEYWORDS.search(line):
            continue
        if _DATE_PATTERNS and re.search(r"\d{4}", line):
            continue

        price = _parse_price(line)
        if price is None:
            continue  # no price = not an item line

        # Extract the name = everything before the price
        name_part = _PRICE_PATTERN.sub("", line).strip()
        name_part = re.sub(r"[\*\@\#\|]+", "", name_part).strip()

        if not name_part or len(name_part) < 2:
            continue

        # Check if this item has a warranty mentioned
        warranty = _extract_warranty(line)

        items.append({
            "name":     name_part.title(),
            "price":    price,
            "warranty": warranty,
        })

    return items


def _extract_warranty(line: str) -> str | None:
    """Checks a single line for warranty duration mentions."""
    match = _WARRANTY_PATTERN.search(line)
    if match:
        duration = match.group(1)
        unit = match.group(2).lower()
        kind = match.group(3) or "warranty"
        return f"{duration} {unit} {kind}".strip()
    return None


def _parse_price(text: str) -> float | None:
    """Extracts the first valid price from a line of text."""
    matches = _PRICE_PATTERN.findall(text)
    for m in matches:
        # findall returns tuples — pick the non-empty group
        raw = m[0] or m[1]
        if raw:
            # Remove currency symbols, spaces, and commas
            cleaned = re.sub(r"[,$€£₹¥₩\s]", "", raw).replace(",", "")
            try:
                value = float(cleaned)
                if 0.01 <= value <= 99999:  # sanity check
                    return value
            except ValueError:
                continue
    return None
