import os
import sys
import json
import base64
import logging
import pytesseract
from PIL import Image
from app.config.config import Config
from app.utils.image_utils import preprocess_image, save_debug_image

logger = logging.getLogger(__name__)

TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"/usr/bin/tesseract",
    r"/usr/local/bin/tesseract",
]

TESSERACT_CONFIG = "--psm 4"
TESSERACT_LANG   = "eng"

DEBUG_MODE = os.getenv("OCR_DEBUG", "false").lower() == "true"

VISION_SYSTEM_PROMPT = (
    "You are a receipt data extraction engine. Analyze the receipt image and "
    "extract structured data. Respond ONLY with a valid JSON object in exactly this shape:\n"
    "{\n"
    '  "transcription": "full raw text of the receipt",\n'
    '  "merchant_name": "store name or null",\n'
    '  "amount": 123.45 or null (the final total payable),\n'
    '  "currency": "MYR" or another 3-letter ISO code or null,\n'
    '  "date": "YYYY-MM-DD" or null,\n'
    '  "items": ["item one", "item two"] (up to 6 item names, no prices)\n'
    "}\n"
    "Do not include any text outside the JSON object."
)

VISION_USER_PROMPT = "Extract the data from this receipt image as JSON."


def _configure_tesseract():
    for path in TESSERACT_PATHS:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info(f"[_configure_tesseract] Tesseract found at: {path}")
            return

    if sys.platform != "win32":
        logger.info("[_configure_tesseract] Non-Windows system — relying on PATH for Tesseract.")
        return

    logger.error("[_configure_tesseract] Tesseract executable not found on this machine.")
    raise EnvironmentError(
        "Tesseract is not installed or not found. "
        "Download it from https://github.com/UB-Mannheim/tesseract/wiki"
    )


try:
    _configure_tesseract()
except EnvironmentError as e:
    logger.warning("[ocr_service] %s — vision LLM will still work, Tesseract fallback disabled.", e)


def run_ocr(image_path: str) -> dict:
    logger.info(f"[run_ocr] Received image for OCR: {image_path}")

    if not os.path.exists(image_path):
        logger.error(f"[run_ocr] Image not found: {image_path}")
        return {
            "success": False,
            "error":   "IMAGE_NOT_FOUND",
            "message": f"No file found at path: {image_path}"
        }

    llm_result = _run_vision_llm(image_path)
    if llm_result.get("success"):
        return llm_result

    logger.warning(
        "[run_ocr] Vision LLM failed (%s) — falling back to Tesseract OCR.",
        llm_result.get("error")
    )
    return _run_tesseract_path(image_path)


# ── Vision LLM (primary) ──────────────────────────────────────────────────────

def _run_vision_llm(image_path: str) -> dict:
    if not (Config.OPENAI_API_KEY or Config.OPENROUTER_API_KEY):
        logger.info("[_run_vision_llm] No AI API key configured — skipping vision LLM.")
        return {"success": False, "error": "NO_API_KEY"}

    try:
        img_b64 = _encode_image(image_path)
        response = _call_vision_api(img_b64)
    except Exception as e:
        logger.error(f"[_run_vision_llm] Vision API call failed: {e}")
        return {"success": False, "error": "VISION_API_FAILED", "message": str(e)}

    parsed = _parse_llm_json(response)
    if parsed is None:
        logger.warning("[_run_vision_llm] LLM response was not valid JSON.")
        return {"success": False, "error": "INVALID_JSON"}

    normalized = _normalize_parsed(parsed)
    logger.info(
        "[_run_vision_llm] Extracted merchant='%s', amount=%s, date='%s'",
        normalized["merchant_name"], normalized["amount"], normalized["date"]
    )
    return {
        "success":  True,
        "source":   "llm",
        "raw_text": normalized.pop("transcription", ""),
        "parsed":   normalized,
    }


def _encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _call_vision_api(img_b64: str) -> str:
    content_parts = [
        {"type": "text", "text": VISION_USER_PROMPT},
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"},
        },
    ]

    if Config.OPENAI_API_KEY:
        from openai import OpenAI
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=Config.OPENAI_VISION_MODEL,
            messages=[
                {"role": "system", "content": VISION_SYSTEM_PROMPT},
                {"role": "user", "content": content_parts},
            ],
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        logger.info("[_call_vision_api] Used OpenAI model '%s'.", Config.OPENAI_VISION_MODEL)
        return resp.choices[0].message.content

    from openai import OpenAI
    client = OpenAI(
        api_key=Config.OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )
    resp = client.chat.completions.create(
        model=Config.OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": VISION_SYSTEM_PROMPT},
            {"role": "user", "content": content_parts},
        ],
        max_tokens=2000,
        extra_headers={
            "HTTP-Referer": "https://expendora.app",
            "X-Title": "Expendora",
        },
    )
    logger.info("[_call_vision_api] Used OpenRouter model '%s'.", Config.OPENROUTER_MODEL)
    return resp.choices[0].message.content


def _parse_llm_json(text: str) -> dict | None:
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(cleaned[start:end + 1])
    except json.JSONDecodeError:
        return None


def _normalize_parsed(data: dict) -> dict:
    items = data.get("items") or []
    if isinstance(items, str):
        items = [items]

    return {
        "transcription": str(data.get("transcription") or ""),
        "merchant_name": _clean_str(data.get("merchant_name")),
        "amount":        _clean_amount(data.get("amount")),
        "currency":      _clean_str(data.get("currency")) or "MYR",
        "date":          _clean_str(data.get("date")),
        "items_context": ", ".join(i for i in items if isinstance(i, str) and i.strip())[:500] or None,
    }


def _clean_str(value) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _clean_amount(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return round(float(value), 2)
    cleaned = str(value).replace(",", "").replace("$", "").strip()
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


# ── Tesseract (fallback) ──────────────────────────────────────────────────────

def _run_tesseract_path(image_path: str) -> dict:
    preprocessed_img = _run_preprocessing(image_path)
    if preprocessed_img is None:
        return {
            "success": False,
            "error":   "PREPROCESSING_FAILED",
            "message": "Image could not be preprocessed before OCR."
        }

    if DEBUG_MODE:
        save_debug_image(preprocessed_img, image_path)

    return _run_tesseract(preprocessed_img, image_path)


def _run_preprocessing(image_path: str) -> Image.Image | None:
    try:
        img = preprocess_image(image_path)
        logger.info(f"[_run_preprocessing] Preprocessing succeeded for: {image_path}")
        return img
    except FileNotFoundError as e:
        logger.error(f"[_run_preprocessing] File missing: {e}")
        return None
    except ValueError as e:
        logger.error(f"[_run_preprocessing] Invalid image file: {e}")
        return None
    except RuntimeError as e:
        logger.error(f"[_run_preprocessing] Preprocessing step failed: {e}")
        return None
    except Exception as e:
        logger.error(f"[_run_preprocessing] Unexpected error during preprocessing: {e}")
        return None


def _run_tesseract(img: Image.Image, image_path: str) -> dict:
    try:
        raw_text = pytesseract.image_to_string(
            img,
            lang=TESSERACT_LANG,
            config=TESSERACT_CONFIG
        )

        cleaned_text = raw_text.strip()

        if not cleaned_text:
            logger.warning(f"[_run_tesseract] OCR returned empty text for: {image_path}")
            return {
                "success": False,
                "error":   "EMPTY_RESULT",
                "message": "OCR completed but no text was extracted. The image may be too blurry or blank."
            }

        logger.info(f"[_run_tesseract] OCR succeeded. Extracted {len(cleaned_text)} characters.")
        return {
            "success":  True,
            "source":   "tesseract",
            "raw_text": cleaned_text,
            "parsed":   None,
        }

    except pytesseract.TesseractNotFoundError:
        logger.error("[_run_tesseract] Tesseract engine not found at runtime.")
        return {
            "success": False,
            "error":   "TESSERACT_NOT_FOUND",
            "message": "Tesseract OCR engine is not installed or not accessible."
        }
    except Exception as e:
        logger.error(f"[_run_tesseract] OCR failed for '{image_path}': {e}")
        return {
            "success": False,
            "error":   "OCR_FAILED",
            "message": f"Tesseract could not process the image. Reason: {str(e)}"
        }
