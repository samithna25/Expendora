import logging
from app.config.config import Config

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {
    "Food & Dining", "Transport", "Grocery", "Shopping", "Bills & Utilities",
    "Entertainment", "Health", "Education", "Income",
    "Banking", "Travel", "Online Shopping", "Beauty", "Phone",
    "Sports", "Pets", "Donations",
}

CATEGORY_LIST = ", ".join(sorted(VALID_CATEGORIES))

SYSTEM_PROMPT = (
    "You are a financial receipt categorizer. "
    "Classify the merchant into exactly ONE spending category based on the merchant name AND the purchased items if provided. "
    "Clothing, apparel, textile, fabric, fashion, and boutique stores ALWAYS belong to 'Shopping'. "
    "Use the items list as strong evidence — if the items are clothes/garments/footwear, choose 'Shopping'. "
    "Return ONLY the category name with no extra text."
)

PROMPT_TEMPLATE = (
    "Classify this merchant into exactly ONE of these categories:\n"
    "{categories}\n\n"
    "Examples:\n"
    "- Merchant: Thilakawardhana Textiles | Items: Ladies Saree, Men's Shirt, Kids T-Shirt -> Shopping\n"
    "- Merchant: Carnage | Items: Hoodie, T-Shirt, Jeans -> Shopping\n"
    "- Merchant: Fashion Point | Items: Dress, Leggings -> Shopping\n"
    "- Merchant: McDonald's | Items: Big Mac, Fries, Coke -> Food & Dining\n"
    "- Merchant: Keells Super | Items: Rice, Bread, Eggs -> Grocery\n"
    "- Merchant: Dialog Axiata | Items: Monthly Bill -> Bills & Utilities\n\n"
    "Return ONLY the category name. No punctuation, no explanation.\n\n"
    "Merchant: {merchant}\n"
    "{items_line}"
)


def categorize_with_ai(merchant_name: str, items_context: str | None = None) -> str | None:
    result = _call_openrouter(merchant_name, items_context)
    if result:
        return result

    result = _call_openai(merchant_name, items_context)
    if result:
        return result

    logger.info("[categorize_with_ai] No AI provider returned a result for '%s'", merchant_name)
    return None


def _build_prompt(merchant_name: str, items_context: str | None) -> str:
    items_line = f"Items: {items_context}" if items_context else ""
    return PROMPT_TEMPLATE.format(
        categories=CATEGORY_LIST,
        merchant=merchant_name,
        items_line=items_line,
    )


def _parse_response(raw: str) -> str | None:
    cleaned = raw.strip().rstrip(".")
    if cleaned in VALID_CATEGORIES:
        return cleaned
    return None


def _call_openrouter(merchant_name: str, items_context: str | None = None) -> str | None:
    api_key = Config.OPENROUTER_API_KEY
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

        resp = client.chat.completions.create(
            model=Config.OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_prompt(merchant_name, items_context)}
            ],
            max_tokens=20,
            extra_headers={
                "HTTP-Referer": "https://expendora.app",
                "X-Title": "Expendora",
            },
        )

        raw = resp.choices[0].message.content
        result = _parse_response(raw)
        if result:
            logger.info("[_call_openrouter] '%s' → %s", merchant_name, result)
            return result

        logger.warning("[_call_openrouter] Response '%s' not in valid categories", raw)
        return None

    except ImportError:
        logger.warning("[_call_openrouter] openai package not installed")
        return None
    except Exception as e:
        logger.warning("[_call_openrouter] API call failed: %s", e)
        return None

def _call_openai(merchant_name: str, items_context: str | None = None) -> str | None:
    api_key = Config.OPENAI_API_KEY
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_prompt(merchant_name, items_context)}
            ],
            max_tokens=20,
        )

        raw = resp.choices[0].message.content
        result = _parse_response(raw)
        if result:
            logger.info("[_call_openai] '%s' → %s", merchant_name, result)
            return result

        logger.warning("[_call_openai] Response '%s' not in valid categories", raw)
        return None

    except ImportError:
        logger.warning("[_call_openai] openai package not installed")
        return None
    except Exception as e:
        logger.warning("[_call_openai] API call failed: %s", e)
        return None
