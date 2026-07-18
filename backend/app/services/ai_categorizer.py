import logging
from app.config.config import Config

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {
    "Food & Dining", "Transport", "Shopping", "Bills & Utilities",
    "Entertainment", "Healthcare", "Education", "Income",
    "Banking", "Travel", "Online Shopping", "Personal Care",
}

CATEGORY_LIST = ", ".join(sorted(VALID_CATEGORIES))
PROMPT_TEMPLATE = (
    "You are a receipt categorizer. Given a merchant name, pick exactly ONE category:\n"
    "{categories}\n\n"
    "Return ONLY the category name. No punctuation, no explanation.\n\n"
    "Merchant: {merchant}"
)


def categorize_with_ai(merchant_name: str) -> str | None:
    result = _call_openrouter(merchant_name)
    if result:
        return result

    result = _call_openai(merchant_name)
    if result:
        return result

    logger.info("[categorize_with_ai] No AI provider returned a result for '%s'", merchant_name)
    return None


def _parse_response(raw: str) -> str | None:
    cleaned = raw.strip().rstrip(".")
    if cleaned in VALID_CATEGORIES:
        return cleaned
    return None


def _call_openrouter(merchant_name: str) -> str | None:
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
                {"role": "user", "content": PROMPT_TEMPLATE.format(
                    categories=CATEGORY_LIST, merchant=merchant_name
                )}
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

def _call_openai(merchant_name: str) -> str | None:
    api_key = Config.OPENAI_API_KEY
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": PROMPT_TEMPLATE.format(
                    categories=CATEGORY_LIST, merchant=merchant_name
                )}
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
