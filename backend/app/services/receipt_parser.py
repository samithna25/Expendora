import re
import logging

logger = logging.getLogger(__name__)

MERCHANT_SKIP_PATTERNS = [
    r'^\d+\s', r'^tel[ée]?', r'^phone', r'^fax', r'^hp',
    r'^gst', r'^sst', r'^date', r'^time', r'^cashier',
    r'^receipt', r'^thank', r'^total', r'^subtotal',
    r'^item', r'^qty', r'^www\.', r'^@', r'^#',
    r'^\d{5}', r'^bill', r'^order', r'^table',
    r'^payment', r'^change', r'^cash', r'^served',
    r'^tax', r'^invoice', r'^no\.', r'^counter',
    r'^server', r'^staff', r'^address', r'^lot',
    r'^unit', r'^floor', r'^opening', r'^operated',
    r'^company', r'^reg',
    # Receipt copy/reprint headers — appear on Keells, Cargills, etc.
    r'^reprint', r'^re-print', r'^copy', r'^duplicate',
    r'^original', r'^customer\s+copy', r'^merchant\s+copy',
]

CURRENCY_MAP = {
    # Sri Lanka (default)
    'lkr': 'LKR', 'rs': 'LKR', 'rs.': 'LKR', 'lk': 'LKR',
    # Malaysia
    'rm': 'MYR', 'myr': 'MYR',
    # Other common
    'usd': 'USD', 'eur': 'EUR', 'gbp': 'GBP', 'sgd': 'SGD',
    'inr': 'INR', 'aud': 'AUD',
}

CURRENCIES_REGEX = r'(?:\brm\b|\bmyr\b|\busd\b|\beur\b|\bgbp\b|\bsgd\b|\bs\$\b|\$|€|£|\brs\.?|\blkr\b|\binr\b|\baud\b)'

TOTAL_PATTERNS = [
    rf'\b(?:net|grand)\s+total\b\s*[:;.]?\s*{CURRENCIES_REGEX}?\s*([\d,]+(?:\.\d{{2}})?)',
    rf'\bnet\s+amount\b\s*(?:due)?\s*[:;.]?\s*{CURRENCIES_REGEX}?\s*([\d,]+(?:\.\d{{2}})?)',
    rf'(?<!\bsub)\s*\btotal\b\s*[:;.]?\s*{CURRENCIES_REGEX}?\s*([\d,]+(?:\.\d{{2}})?)',
    rf'\bbalance\b\s*(?:due)?\s*[:;.]?\s*{CURRENCIES_REGEX}?\s*([\d,]+(?:\.\d{{2}})?)',
    rf'\bamount\b\s*(?:due)?\s*[:;.]?\s*{CURRENCIES_REGEX}?\s*([\d,]+(?:\.\d{{2}})?)',
    rf'{CURRENCIES_REGEX}\s*([\d,]+(?:\.\d{{2}})?)',
]

DATE_PATTERNS = [
    # Explicit label: "Date: YYYY-MM-DD" or "Date: DD/MM/YYYY" etc.
    (r'\bdate\s*[:.]?\s*(\d{4})[/-](\d{2})[/-](\d{2})\b', lambda m: f"{m.group(1)}-{m.group(2)}-{m.group(3)}"),
    (r'\bdate\s*[:.]?\s*(\d{2})[/-](\d{2})[/-](\d{4})\b', lambda m: f"{m.group(3)}-{m.group(2)}-{m.group(1)}"),
    # ISO / common formats without label
    (r'(?<!\d)(\d{4})[/-](\d{2})[/-](\d{2})(?!\d)', lambda m: f"{m.group(1)}-{m.group(2)}-{m.group(3)}"),
    (r'(?<!\d)(\d{2})[/-](\d{2})[/-](\d{4})(?!\d)', lambda m: f"{m.group(3)}-{m.group(2)}-{m.group(1)}"),
]

MONTH_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
    'may': 5, 'jun': 6, 'jul': 7, 'aug': 8,
    'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
}

SORTED_MONTH_NAMES = '|'.join(sorted(MONTH_MAP.keys(), key=len, reverse=True))

DATE_TEXT_PATTERNS = [
    rf'({SORTED_MONTH_NAMES})\s+(\d{{1,2}}),?\s+(\d{{4}})',
    rf'(\d{{1,2}})\s+({SORTED_MONTH_NAMES})\s+(\d{{4}})',
]

SKIP_DATE_LABELS = re.compile(
    r'(exp|expiry|expiration|valid|valid thru|valid through|use by|best before)\s*(date)?\s*[:.]',
    re.IGNORECASE
)


def parse_receipt_text(raw_text: str) -> dict:
    if not raw_text or not raw_text.strip():
        return {"merchant_name": None, "amount": None, "currency": "MYR", "date": None, "items_context": None}

    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    merchant = _extract_merchant(lines)
    amount, currency = _extract_amount(raw_text)
    date = _extract_date(raw_text)
    items_context = _extract_items(lines)

    return {
        "merchant_name": merchant,
        "amount": amount,
        "currency": currency or "LKR",   # Default to LKR (Sri Lanka)
        "date": date,
        "items_context": items_context,
    }


def _extract_merchant(lines: list[str]) -> str | None:
    # Patterns that clearly signal the merchant header has ended
    STOP_PATTERNS = re.compile(
        r'^(original\s+receipt|tax\s+invoice|invoice|receipt|address|branch|store|'
        r'no\.|phone|tel|fax|date|time|cashier|thank|subtotal|total|item|qty|'
        r'www\.|@|#|\d{5,})',
        re.IGNORECASE,
    )

    first_idx = None
    for i, line in enumerate(lines):
        cleaned = line.strip()
        if len(cleaned) < 3:
            continue
        if any(re.match(p, cleaned, re.IGNORECASE) for p in MERCHANT_SKIP_PATTERNS):
            continue
        first_idx = i
        break

    if first_idx is None:
        return None

    # Collect the first valid line, then look ahead for continuation lines
    # A continuation is: short (≤ 40 chars), no standalone digits, not a stop-word line
    parts = [lines[first_idx].strip()]
    for line in lines[first_idx + 1 : first_idx + 4]:   # look at up to 3 more lines
        cleaned = line.strip()
        if not cleaned or len(cleaned) < 2:
            break
        if STOP_PATTERNS.match(cleaned):
            break
        if any(re.match(p, cleaned, re.IGNORECASE) for p in MERCHANT_SKIP_PATTERNS):
            break
        # Stop if this line looks like an address (has digits mixed with text)
        if re.search(r'\b\d{2,}\b', cleaned):
            break
        # Stop if the line is too long to be a store-name continuation
        if len(cleaned) > 40:
            break
        parts.append(cleaned)

    return " ".join(parts)


def _extract_amount(text: str) -> tuple:
    for pattern in TOTAL_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = _to_float(match.group(1))
            if val is not None:
                currency = _detect_currency(text[:match.end()])
                return val, currency

    fallback = _find_best_fallback(text)
    if fallback:
        return fallback

    return None, None


_FALLBACK_SKIP_LINE = re.compile(
    r'\b(?:subtotal|discount|tax|gst|sst|vat|change|cash|payment|tips?|service)\b',
    re.IGNORECASE,
)


def _find_best_fallback(text: str) -> tuple | None:
    lines = text.strip().split('\n')
    candidates = []
    skipped_candidates = []

    for line in lines:
        numbers = re.findall(r'([\d,]+\.\d{2})', line)
        if not numbers:
            continue
        is_skip = bool(_FALLBACK_SKIP_LINE.search(line))
        for num in numbers:
            val = _to_float(num)
            if val is not None:
                entry = (val, _detect_currency(line))
                if is_skip:
                    skipped_candidates.append(entry)
                else:
                    candidates.append(entry)

    if candidates:
        return candidates[-1]
    return None


def _detect_currency(text: str) -> str | None:
    text_lower = text.lower()
    for sym, code in CURRENCY_MAP.items():
        if re.search(rf'\b{re.escape(sym)}\b', text_lower):
            return code
    if '€' in text:
        return 'EUR'
    if '£' in text:
        return 'GBP'
    if '$' in text:
        return 'USD'
    return None


def _to_float(s: str) -> float | None:
    try:
        return float(s.replace(',', ''))
    except (ValueError, AttributeError):
        return None


def _extract_date(text: str) -> str | None:
    for pattern, formatter in DATE_PATTERNS:
        for match in re.finditer(pattern, text):
            candidate = formatter(match)
            if _is_valid_date(candidate) and not _is_expiry_date(text, match.start()):
                return candidate

    text_lower = text.lower()
    for pattern_str in DATE_TEXT_PATTERNS:
        for match in re.finditer(pattern_str, text_lower):
            groups = match.groups()
            a, b, c = groups
            if a in MONTH_MAP:
                month = MONTH_MAP[a]
                day = int(b)
                year = int(c)
            elif b in MONTH_MAP:
                month = MONTH_MAP[b]
                day = int(a)
                year = int(c)
            else:
                continue
            if 1 <= day <= 31 and 1 <= month <= 12:
                formatted = f"{year:04d}-{month:02d}-{day:02d}"
                if not _is_expiry_date(text, match.start()):
                    return formatted

    return None


def _is_valid_date(date_str: str) -> bool:
    try:
        parts = date_str.split('-')
        y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
        return 1 <= m <= 12 and 1 <= d <= 31
    except (ValueError, IndexError):
        return False


def _is_expiry_date(text: str, position: int) -> bool:
    before = text[max(0, position - 40):position].rstrip()
    for match in SKIP_DATE_LABELS.finditer(before):
        if match.end() == len(before):
            return True
    return False


# Lines that signal we've left the item list zone
_ITEM_SKIP = re.compile(
    r'^(subtotal|total|discount|net\s+amount|amount|payment|cash|change|balance|'
    r'vat|tax|gst|sst|tip|service|thank|loyalty|points|receipt|invoice|'
    r'date|time|cashier|branch|store|phone|tel|www\.|@|id\s)',
    re.IGNORECASE,
)
# Lines that are purely prices / numbers (no useful item name)
_PRICE_ONLY = re.compile(r'^[\d\s,.]+$')


def _extract_items(lines: list[str]) -> str | None:
    """
    Extract purchased item names from the receipt body.
    Returns up to 6 item names joined by ', ', or None if none found.

    Strategy: skip the first few header lines (merchant name, address, etc.),
    then collect lines that look like product names until we hit totals/footer.
    """
    items: list[str] = []
    in_item_zone = False

    for line in lines:
        cleaned = line.strip()
        if not cleaned or len(cleaned) < 3:
            continue

        # Entering the item zone: look for a header row like "Item", "Description", "Qty"
        if re.search(r'\b(item|description|product|qty|price|amount)\b', cleaned, re.IGNORECASE):
            in_item_zone = True
            continue

        # Once in the item zone, stop at totals / footer
        if in_item_zone and _ITEM_SKIP.match(cleaned):
            break

        if not in_item_zone:
            continue

        # Skip lines that are just numbers/prices
        if _PRICE_ONLY.match(cleaned):
            continue

        # Strip leading item-number prefix like "1." or "1 "
        item_name = re.sub(r'^\d+[\.\)]\s*', '', cleaned).strip()

        # Remove trailing price info "   4950.00  1  4950.00"
        item_name = re.sub(r'\s+[\d,]+\.\d{2}.*$', '', item_name).strip()

        if len(item_name) >= 3:
            items.append(item_name)

        if len(items) >= 6:
            break

    return ", ".join(items) if items else None

