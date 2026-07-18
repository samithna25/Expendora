import logging
from app.database.db import find_merchant, save_merchant
from app.services.ai_categorizer import categorize_with_ai

logger = logging.getLogger(__name__)

KEYWORD_MAP = {
    "Food & Dining": [
        "starbucks", "mcdonalds", "kfc", "subway", "pizzahut", "dominos",
        "burger king", "restaurant", "cafe", "coffee", "bakery", "pizza",
        "burger", "sushi", "food", "dining", "grill", "bistro",
        "mcdonald's",
    ],
    "Transport": [
        "grab", "uber", "taxi", "petrol", "fuel", "gas", "toll",
        "parking", "bus", "train", "railway", "airline", "airasia",
        "petronas", "caltex", "esso", "sinopec",
    ],
    "Shopping": [
        "supermarket", "mall", "mart", "retail", "department store",
        "aeon", "uniqlo", "walmart", "target", "costco",
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


def map_category(merchant_name: str | None) -> str:
    if not merchant_name:
        return "Uncategorized"

    merchant = find_merchant(merchant_name)
    if merchant:
        logger.info(
            "[map_category] '%s' → '%s' (DB hit)", merchant_name, merchant["category"]
        )
        return merchant["category"]

    category = categorize_with_ai(merchant_name)
    if category:
        save_merchant(merchant_name, [], category)
        logger.info("[map_category] '%s' → '%s' (AI + saved)", merchant_name, category)
        return category

    name_lower = merchant_name.lower()
    for cat, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in name_lower:
                logger.info(
                    "[map_category] '%s' → '%s' (keyword fallback)", merchant_name, cat
                )
                return cat

    logger.info("[map_category] '%s' → 'Uncategorized'", merchant_name)
    return "Uncategorized"
