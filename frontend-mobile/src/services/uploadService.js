import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

export const uploadService = {
  /**
   * Upload a receipt image to the backend for OCR processing.
   * Uses a dedicated fetch call with a 60-second timeout to allow
   * for Tesseract OCR + Cloudinary upload time.
   *
   * @param {string} uri       - Local file URI from image picker or camera
   * @param {string} fileName  - File name (e.g. "receipt.jpg")
   * @param {string} fileType  - MIME type (e.g. "image/jpeg")
   * @returns {Promise<object>} - API response with merchant_name, amount, date, category, image_url
   */
  async uploadReceipt(uri, fileName, fileType) {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: fileType,
    });

    const controller = new AbortController();
    // OCR + Cloudinary can take up to ~40s — give it 60s before timing out
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_BASE_URL}/receipts/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Do NOT set Content-Type — let fetch set multipart/form-data boundary automatically
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json = await response.json().catch(() => ({ message: 'Upload failed' }));

      if (!response.ok) {
        throw new Error(json.message || `Upload failed with status ${response.status}`);
      }

      return json;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Receipt upload timed out. The server may be busy — please try again.');
      }
      throw err;
    }
  },
};
