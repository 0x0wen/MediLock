import { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Progress,
  useToast,
  Heading,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
} from "@chakra-ui/react";


const OpenAIProcessor = ({ image, onOcrComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const processImage = async () => {
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    // Reset any previous errors
    setError(null);
    setIsProcessing(true);
    setProgress(10); // Start progress

    try {
      // Check image size
      if (image.size > 20 * 1024 * 1024) {
        // 20MB limit
        throw new Error(
          "Image size exceeds 20MB limit. Please use a smaller image."
        );
      }

      // Convert the image to base64
      const base64Image = await getBase64(image);
      setProgress(30);

      // Call OpenAI API
      const response = await callOpenAIVisionAPI(base64Image);
      setProgress(90);

      if (response && response.text) {
        // Process the OCR text into structured JSON
        const jsonResult = processTextToJson(response.text);
        onOcrComplete(jsonResult);

        toast({
          title: "Processing completed",
          description: "Text has been extracted and converted to JSON.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to process image. No text was extracted.");
      }

      setProgress(100);
      setIsProcessing(false);
    } catch (error) {
      console.error("OpenAI processing error:", error);
      setError(error.message || "There was an error processing the image");
      setIsProcessing(false);
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Get the data URL without modifications
        const dataUrl = reader.result;
        resolve(dataUrl);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const callOpenAIVisionAPI = async (dataUrl) => {
    try {
      // Validate API key format (simple validation)
      if (!apiKey.startsWith("sk-")) {
        throw new Error(
          "Invalid API key format. OpenAI API keys start with 'sk-'"
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all text from this image. Return it exactly as formatted in the image. If there are any tables or structured data, preserve their format as best as possible.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: dataUrl,
                    },
                  },
                ],
              },
            ],
            max_tokens: 4096,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Response Error:", errorData);
        throw new Error(
          errorData.error?.message ||
            `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract text from response
      const text = data.choices?.[0]?.message?.content || "";
      if (!text.trim()) {
        throw new Error("No text was extracted from the image");
      }
      return { text };
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  // Function to convert OCR text to structured JSON
  const processTextToJson = (text) => {
    // Split the text by lines and filter out empty lines
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    // Create a simple structure based on key-value pairs
    const result = {};

    // Try to detect tables and better key-value extraction
    let inTable = false;
    let tableHeaders = [];
    let tableRows = [];

    lines.forEach((line) => {
      // Try to detect key-value pairs (e.g., "Name: John Doe")
      const keyValueMatch = line.match(/^([^:]+):(.*)$/);

      // Check if line might be part of a table (contains multiple separators)
      const tableRowMatch =
        line.includes("|") ||
        line.includes("\t") ||
        line.split(/\s{2,}/).length > 2;

      if (keyValueMatch && !tableRowMatch) {
        const key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();
        result[key] = value;
      }
      // Handle possible table structures
      else if (tableRowMatch) {
        if (!inTable) {
          inTable = true;
          // Attempt to extract headers
          if (line.includes("|")) {
            tableHeaders = line
              .split("|")
              .map((h) => h.trim())
              .filter((h) => h);
          } else if (line.includes("\t")) {
            tableHeaders = line
              .split("\t")
              .map((h) => h.trim())
              .filter((h) => h);
          } else {
            tableHeaders = line
              .split(/\s{2,}/)
              .map((h) => h.trim())
              .filter((h) => h);
          }
        } else {
          // Extract row data
          let rowData;
          if (line.includes("|")) {
            rowData = line
              .split("|")
              .map((c) => c.trim())
              .filter((c) => c);
          } else if (line.includes("\t")) {
            rowData = line
              .split("\t")
              .map((c) => c.trim())
              .filter((c) => c);
          } else {
            rowData = line
              .split(/\s{2,}/)
              .map((c) => c.trim())
              .filter((c) => c);
          }

          if (rowData.length > 0) {
            tableRows.push(rowData);
          }
        }
      } else {
        // If not a clear key-value pair or table, add to a 'content' array
        if (!result.content) {
          result.content = [];
        }
        result.content.push(line.trim());
      }
    });

    // Add table data to result if we found any
    if (tableHeaders.length > 0 && tableRows.length > 0) {
      result.table = {
        headers: tableHeaders,
        rows: tableRows,
      };
    }

    return result;
  };

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setShowApiKeyInput(false);
    processImage();
  };

  return (
    <VStack spacing={4} w="100%">
      <Heading size="md">OpenAI Vision Processing</Heading>

      {error && (
        <Alert status="error" variant="solid" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription display="block">{error}</AlertDescription>
          </Box>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setError(null)}
          />
        </Alert>
      )}

      {showApiKeyInput ? (
        <FormControl>
          <FormLabel>Enter your OpenAI API Key</FormLabel>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <Button mt={2} colorScheme="blue" onClick={handleApiKeySubmit}>
            Submit
          </Button>
          <Text fontSize="xs" mt={1} color="gray.500">
            Your API key is used only for this request and is not stored.
          </Text>
        </FormControl>
      ) : isProcessing ? (
        <Box w="100%">
          <Text mb={2}>Processing image... {progress}%</Text>
          <Progress value={progress} size="sm" colorScheme="blue" />
        </Box>
      ) : (
        <Button
          colorScheme="blue"
          onClick={processImage}
          isDisabled={!image}
          w="100%"
        >
          Process with OpenAI Vision
        </Button>
      )}

      <Text fontSize="sm" color="gray.500" textAlign="center">
        Note: This component makes API calls directly to OpenAI using the GPT-4o
        model. If you experience issues, try using a smaller image (under 20MB)
        or check your API key.
      </Text>
    </VStack>
  );
};

export default OpenAIProcessor;
