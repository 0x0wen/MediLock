import { useState } from "react";
import ImageUpload from "./ImageUpload";
import OpenAIProcessor from "./OpenAIProcessor";
import JsonDisplay from "./JsonDisplay";
import FhirDisplay from "./FhirDisplay";
import useOcrToFhir from "../hooks/useOcrToFhir";

export default function FormOcr() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [jsonResult, setJsonResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("fhir");
  const { fhirData, rawData, processOcrData } = useOcrToFhir();

  const handleImageUpload = (file) => {
    setSelectedImage(file);
    // Clear previous results when a new image is uploaded
    setJsonResult(null);
  };

  const handleOcrComplete = (result) => {
    setJsonResult(result);
    // Convert OCR result to FHIR format
    processOcrData(result);
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 text-blue-800">
              Medical Document Scanner
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload a medical document image to extract information and convert
              it to structured FHIR format
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Upload Document
            </h2>
            <ImageUpload onImageUpload={handleImageUpload} />
          </div>

          {selectedImage && (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Process Document
              </h2>
              <OpenAIProcessor
                image={selectedImage}
                onOcrComplete={handleOcrComplete}
              />
            </div>
          )}

          {(fhirData || jsonResult) && (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Results
              </h2>

              <div className="mb-6">
                <div className="inline-flex rounded-md shadow-sm bg-gray-100 p-1">
                  <button
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                      activeResultTab === "fhir"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => setActiveResultTab("fhir")}
                  >
                    FHIR Format
                  </button>
                  <button
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                      activeResultTab === "raw"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => setActiveResultTab("raw")}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {activeResultTab === "fhir" && (
                  <FhirDisplay jsonData={fhirData} rawData={rawData} />
                )}
                {activeResultTab === "raw" && (
                  <JsonDisplay jsonData={jsonResult} />
                )}
              </div>
            </div>
          )}

          <div className="text-center text-gray-500 text-sm mt-8">
            <p>
              &copy; {new Date().getFullYear()} MediLock - Secure Medical
              Records on Blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
