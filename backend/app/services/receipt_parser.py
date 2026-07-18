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
]

CURRENCY_MAP = {
    'rm': 'MYR', 'myr': 'MYR',
    'usd': 'USD', 'eur': 'EUR', 'gbp': 'GBP', 'sgd': 'SGD',
}

TOTAL_PATTERNS = [
    r'(?:grand\s+)?\btotal\b\s*[:;.]?\s*(?:rm|myr|usd|eur|gbp|sgd|s\$|\$|€|£)?\s*([\d,]+\.\d{2})',
    r'\bamount\b\s*(?:due)?\s*[:;.]?\s*(?:rm|myr|usd|eur|gbp|sgd|s\$|\$|€|£)?\s*([\d,]+\.\d{2})',
    r'\bbalance\b\s*(?:due)?\s*[:;.]?\s*(?:rm|myr|usd|eur|gbp|sgd|s\$|\$|€|£)?\s*([\d,]+\.\d{2})',
    r'(?:rm|myr|usd|eur|gbp|sgd|s\$|\$|€|£)\s*([\d,]+\.\d{2})',
]

DATE_PATTERNS = [
    (r'(\d{2})[/-](\d{2})[/-](\d{4})', lambda m: f"{m.group(3)}-{m.group(2)}-{m.group(1)}"),
    (r'(\d{4})[/-](\d{2})[/-](\d{2})', lambda m: f"{m.group(1)}-{m.group(2)}-{m.group(3)}"),
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
        return {"merchant_name": None, "amount": None, "currency": "MYR", "date": None}

    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    merchant = _extract_merchant(lines)
    amount, currency = _extract_amount(raw_text)
    date = _extract_date(raw_text)

    return {
        "merchant_name": merchant,
        "amount": amount,
        "currency": currency or "MYR",
        "date": date,
    }


def _extract_merchant(lines: list[str]) -> str | None:
    for line in lines:
        cleaned = line.strip()
        if len(cleaned) < 3:
            continue
        if any(re.match(p, cleaned, re.IGNORECASE) for p in MERCHANT_SKIP_PATTERNS):
            continue
        return cleaned
    return None


def _extract_amount(text: str) -> tuple:
    for pattern in TOTAL_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = _to_float(match.group(1))
            if val is not None:
                currency = _detect_currency(text[:match.end()])
                return val, currency

    fallback = re.findall(r'([\d,]+\.\d{2})', text)
    if fallback:
        val = _to_float(fallback[-1])
        if val is not None:
            return val, _detect_currency(text)

    return None, None


def _detect_currency(text: str) -> str | None:
    text_lower = text.lower()
    for sym, code in CURRENCY_MAP.items():
        if sym in text_lower:
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
