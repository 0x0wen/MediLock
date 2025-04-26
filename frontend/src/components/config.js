/**
 * Application configuration
 *
 * In production, you should use environment variables for sensitive information
 * like API keys. This file shows how to do this with Vite's environment variables.
 *
 * See the .env.example file for the expected format.
 */

// OpenAI API key (replace with your actual key)
// In production, use environment variables instead of hardcoding
export const OPENAI_API_KEY =
  import.meta.env.VITE_OPENAI_API_KEY ||
  "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";

// Server settings for OpenAI proxy
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

// Tesseract OCR settings
export const TESSERACT_LANGUAGE =
  import.meta.env.VITE_TESSERACT_LANGUAGE || "eng";

// Export default config for easy importing
const config = {
  OPENAI_API_KEY,
  SERVER_URL,
  TESSERACT_LANGUAGE,
};

export default config;
