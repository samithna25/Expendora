import os
import logging
from PIL import Image, ImageEnhance

logger = logging.getLogger(__name__)

MIN_WIDTH_PX = 1000
BINARIZATION_THRESHOLD = 140
MAX_SKEW_DEGREES = 45


def preprocess_image(image_path: str) -> Image.Image:
    if not os.path.exists(image_path):
        logger.error(f"[preprocess_image] File not found: {image_path}")
        raise FileNotFoundError(f"Image file not found: {image_path}")

    img = _load_image(image_path)
    img = _to_grayscale(img)
    img = _enhance_contrast(img)
    img = _apply_threshold(img)
    img = _resize_if_needed(img)
    img = _correct_skew(img)

    logger.info(f"[preprocess_image] Preprocessing complete. Final size: {img.size}")
    return img


def _load_image(image_path: str) -> Image.Image:
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        return img
    except Exception as e:
        logger.error(f"[_load_image] Cannot open image '{image_path}': {e}")
        raise ValueError(f"Invalid or corrupt image file: {image_path}") from e


def _to_grayscale(img: Image.Image) -> Image.Image:
    try:
        return img.convert("L")
    except Exception as e:
        logger.error(f"[_to_grayscale] Failed: {e}")
        raise RuntimeError("Grayscale conversion failed.") from e


def _enhance_contrast(img: Image.Image) -> Image.Image:
    try:
        enhancer = ImageEnhance.Contrast(img)
        return enhancer.enhance(2.0)
    except Exception as e:
        logger.error(f"[_enhance_contrast] Failed: {e}")
        raise RuntimeError("Contrast enhancement failed.") from e


def _apply_threshold(img: Image.Image) -> Image.Image:
    try:
        return img.point(lambda px: 0 if px < BINARIZATION_THRESHOLD else 255, "L")
    except Exception as e:
        logger.error(f"[_apply_threshold] Failed: {e}")
        raise RuntimeError("Binary thresholding failed.") from e


def _resize_if_needed(img: Image.Image) -> Image.Image:
    try:
        width, height = img.size
        if width < MIN_WIDTH_PX:
            scale_factor = MIN_WIDTH_PX / width
            new_width  = int(width  * scale_factor)
            new_height = int(height * scale_factor)
            img = img.resize((new_width, new_height), Image.LANCZOS)
            logger.debug(f"[_resize_if_needed] Upscaled to {new_width}x{new_height}.")
        return img
    except Exception as e:
        logger.error(f"[_resize_if_needed] Failed: {e}")
        raise RuntimeError("Image resize failed.") from e


def _correct_skew(img: Image.Image) -> Image.Image:
    try:
        skew_angle = _detect_skew_angle(img)

        if skew_angle is None or abs(skew_angle) < 0.5:
            return img

        logger.debug(f"[_correct_skew] Correcting skew of {skew_angle:.2f}°.")
        return img.rotate(
            -skew_angle,
            resample=Image.BICUBIC,
            expand=True,
            fillcolor=255
        )
    except Exception as e:
        logger.warning(f"[_correct_skew] Skew correction failed — using original. Reason: {e}")
        return img


def _detect_skew_angle(img: Image.Image) -> float | None:
    try:
        thumb = img.copy()
        thumb.thumbnail((400, 400), Image.LANCZOS)

        best_angle    = 0.0
        best_variance = -1.0

        angle = -MAX_SKEW_DEGREES
        while angle <= MAX_SKEW_DEGREES:
            rotated = thumb.rotate(angle, resample=Image.NEAREST, expand=False, fillcolor=255)
            width, height = rotated.size
            
            # Fast row average using Pillow's C-optimized resize
            row_avg_img = rotated.resize((1, height), resample=Image.BOX)
            row_averages = list(row_avg_img.getdata())

            n = height
            mean = sum(row_averages) / n
            variance = sum((s - mean) ** 2 for s in row_averages) / n

            if variance > best_variance:
                best_variance = variance
                best_angle    = angle

            angle = round(angle + 0.5, 1)

        return best_angle
    except Exception as e:
        logger.warning(f"[_detect_skew_angle] Detection failed: {e}")
        return None


def save_debug_image(img: Image.Image, original_path: str, suffix: str = "preprocessed") -> str:
    try:
        directory  = os.path.dirname(original_path)
        basename   = os.path.splitext(os.path.basename(original_path))[0]
        debug_path = os.path.join(directory, f"{basename}_{suffix}.jpg")
        img.convert("RGB").save(debug_path, format="JPEG", quality=95)
        logger.debug(f"[save_debug_image] Saved at: {debug_path}")
        return debug_path
    except Exception as e:
        logger.warning(f"[save_debug_image] Could not save debug image: {e}")
        return ""
