import { useState } from "react";
import convertToFhirBundle from "../utils/fhirConverter";

/**
 * Custom hook for handling OCR data processing and conversion to FHIR format
 */
const useOcrToFhir = () => {
  const [rawData, setRawData] = useState(null);
  const [fhirData, setFhirData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Process OCR data and convert to FHIR format
   * @param {Object} ocrData - The data extracted from OCR
   */
  const processOcrData = (ocrData) => {
    if (!ocrData) {
      setError("No OCR data to process");
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Store the raw OCR data
      setRawData(ocrData);

      // Convert OCR data to FHIR bundle
      const fhirBundle = convertToFhirBundle(ocrData);

      // Store the FHIR data
      setFhirData(fhirBundle);
      setIsProcessing(false);

      return fhirBundle;
    } catch (err) {
      console.error("Error converting OCR data to FHIR:", err);
      setError(`Error converting to FHIR: ${err.message}`);
      setIsProcessing(false);
      return null;
    }
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setRawData(null);
    setFhirData(null);
    setIsProcessing(false);
    setError(null);
  };

  return {
    rawData,
    fhirData,
    isProcessing,
    error,
    processOcrData,
    reset,
  };
};

export default useOcrToFhir;
