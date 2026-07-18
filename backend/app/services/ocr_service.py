import os
import sys
import logging
import pytesseract
from PIL import Image
from app.utils.image_utils import preprocess_image, save_debug_image

logger = logging.getLogger(__name__)

TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"/usr/bin/tesseract",
    r"/usr/local/bin/tesseract",
]

TESSERACT_CONFIG = "--psm 6"
TESSERACT_LANG   = "eng"

DEBUG_MODE = os.getenv("OCR_DEBUG", "false").lower() == "true"


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


_configure_tesseract()


def run_ocr(image_path: str) -> dict:
    logger.info(f"[run_ocr] Received image for OCR: {image_path}")

    if not os.path.exists(image_path):
        logger.error(f"[run_ocr] Image not found: {image_path}")
        return {
            "success": False,
            "error":   "IMAGE_NOT_FOUND",
            "message": f"No file found at path: {image_path}"
        }

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
            "raw_text": cleaned_text
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
