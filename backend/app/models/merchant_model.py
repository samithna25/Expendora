from datetime import datetime, timezone


def create_merchant_doc(name: str, aliases: list, category: str):
    return {
        "name": name.strip(),
        "aliases": [a.strip().lower() for a in aliases if a.strip()],
        "category": category,
        "created_at": datetime.now(timezone.utc),
    }
