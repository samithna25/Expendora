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
        "food city", "food mart", "food store",          # food city = Cargills chain
        "keells", "cargills", "sathosa",
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


def map_category(merchant_name: str | None, items_context: str | None = None) -> str:
    if not merchant_name:
        return "Uncategorized"

    # 1. Keyword check FIRST — authoritative, prevents stale DB entries from overriding
    keyword_cat = _keyword_category(merchant_name)
    if keyword_cat:
        return keyword_cat

    # 2. DB lookup (only for merchants with no keyword match)
    merchant = find_merchant(merchant_name)
    if merchant:
        logger.info(
            "[map_category] '%s' -> '%s' (DB hit)", merchant_name, merchant["category"]
        )
        return merchant["category"]

    # 3. AI categorization — pass items as extra context for ambiguous merchant names
    category = categorize_with_ai(merchant_name, items_context)
    if category:
        save_merchant(merchant_name, [], category)
        logger.info("[map_category] '%s' -> '%s' (AI + saved)", merchant_name, category)
        return category

    logger.info("[map_category] '%s' -> 'Uncategorized'", merchant_name)
    return "Uncategorized"
