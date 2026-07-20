import logging
from app.database.db import find_merchant, save_merchant
from app.services.ai_categorizer import categorize_with_ai

logger = logging.getLogger(__name__)

KEYWORD_MAP = {
    "Food & Dining": [
        "starbucks", "mcdonalds", "kfc", "subway", "pizzahut", "dominos",
        "burger king", "restaurant", "cafe", "coffee", "bakery", "pizza",
        "burger", "sushi", "dining", "grill", "bistro",
        "mcdonald's", "eatery", "diner",
    ],
    "Transport": [
        "grab", "uber", "taxi", "petrol", "fuel", "gas", "toll",
        "parking", "bus", "train", "railway", "airline", "airasia",
        "petronas", "caltex", "esso", "sinopec",
    ],
    "Grocery": [
        "supermarket", "grocery", "groceries", "super", "mart",
        "food city", "food mart", "food store",
        "keells", "keels",     # Keells Super (both spellings appear on receipts)
        "cargills", "sathosa",
    ],
    "Shopping": [
        "mall", "retail", "department store",
        "aeon", "uniqlo", "walmart", "target", "costco",
        # Textile / clothing / fashion merchants
        "textile", "textiles", "cloth", "cloths", "clothing", "clothes",
        "garment", "garments", "fabric", "fabrics", "fashion",
        "boutique", "apparel", "saree", "sarees", "dress", "wear",
        "tailor", "tailoring", "linen", "silk", "cotton",
    ],
    "Bills & Utilities": [
        "utility", "bill", "electric", "water", "internet", "phone",
        "telecom", "insurance", "tnb", "unifi", "maxis", "celcom",
    ],
    "Entertainment": [
        "cinema", "movie", "theatre", "theater", "netflix", "spotify",
        "steam", "game", "playstation", "xbox", "ticket", "tgv", "gsc",
    ],
    "Healthcare": [
        "hospital", "clinic", "pharmacy", "doctor", "dental", "medical",
        "health", "medicare",
    ],
    "Education": [
        "university", "college", "school", "tuition", "academy",
        "institute", "coursera", "udemy",
    ],
}


def _keyword_category(merchant_name: str) -> str | None:
    """Check KEYWORD_MAP first — fast, reliable, no network call needed."""
    name_lower = merchant_name.lower()
    for cat, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in name_lower:
                logger.info(
                    "[map_category] '%s' → '%s' (keyword match)", merchant_name, cat
                )
                return cat
    return None


# Maps the extended category labels used internally (and by AI) to the
# exact values accepted by expense_controller.py's VALID_CATEGORIES set.
# expense_controller accepts: Food, Transport, Shopping, Bills, Entertainment, Other
CATEGORY_NORMALISE = {
    "food & dining": "Food",
    "grocery": "Food",       # Keells, Cargills, supermarkets → Food
    "groceries": "Food",
    "transport": "Transport",
    "shopping": "Shopping",
    "online shopping": "Shopping",
    "bills & utilities": "Bills",
    "bills": "Bills",
    "utilities": "Bills",
    "entertainment": "Entertainment",
    "healthcare": "Other",
    "health": "Other",
    "education": "Other",
    "banking": "Other",
    "travel": "Transport",
    "personal care": "Other",
    "income": "Other",
    "uncategorized": "Other",
    # Direct matches (already correct)
    "food": "Food",
    "other": "Other",
}


def _normalise_category(raw: str) -> str:
    """Convert any category label to one accepted by expense_controller."""
    return CATEGORY_NORMALISE.get(raw.lower().strip(), "Other")


def map_category(merchant_name: str | None, items_context: str | None = None) -> str:
    if not merchant_name:
        return "Other"

    # 1. Keyword check FIRST — authoritative, prevents stale DB entries from overriding
    keyword_cat = _keyword_category(merchant_name)
    if keyword_cat:
        return _normalise_category(keyword_cat)

    # 2. DB lookup (only for merchants with no keyword match)
    merchant = find_merchant(merchant_name)
    if merchant:
        logger.info(
            "[map_category] '%s' -> '%s' (DB hit)", merchant_name, merchant["category"]
        )
        return _normalise_category(merchant["category"])

    # 3. AI categorization — pass items as extra context for ambiguous merchant names
    category = categorize_with_ai(merchant_name, items_context)
    if category:
        save_merchant(merchant_name, [], category)
        logger.info("[map_category] '%s' -> '%s' (AI + saved)", merchant_name, category)
        return _normalise_category(category)

    logger.info("[map_category] '%s' -> 'Other' (fallback)", merchant_name)
    return "Other"
