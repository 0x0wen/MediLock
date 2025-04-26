import { useState } from "react";
import { createWorker } from "tesseract.js";
import {
  Box,
  Button,
  VStack,
  Text,
  Progress,
  useToast,
  Heading,
} from "@chakra-ui/react";

const OcrProcessor = ({ image, onOcrComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
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

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create a URL for the image file
      const imageUrl = URL.createObjectURL(image);

      const worker = await createWorker({
        logger: (m) => {
          console.log(m); // Add this to see the logger messages in the console
          if (m.status === "recognizing text") {
            setProgress(parseInt(m.progress * 100));
          }
        },
      });

      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      // Use the image URL instead of the File object
      const { data } = await worker.recognize(imageUrl);

      // Clean up the URL after use
      URL.revokeObjectURL(imageUrl);

      await worker.terminate();

      setIsProcessing(false);

      // Process the OCR text into structured JSON
      const jsonResult = processTextToJson(data.text);
      onOcrComplete(jsonResult);

      toast({
        title: "OCR completed",
        description: "Text has been extracted and converted to JSON.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("OCR processing error:", error);
      toast({
        title: "Processing failed",
        description: "There was an error processing the image.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsProcessing(false);
    }
  };

  // Function to convert OCR text to structured JSON
  // This is a simple example - you'll need to adapt this to your specific use case
  const processTextToJson = (text) => {
    // Split the text by lines and filter out empty lines
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    // Create a simple structure based on key-value pairs
    const result = {};

    lines.forEach((line) => {
      // Try to detect key-value pairs (e.g., "Name: John Doe")
      const match = line.match(/^([^:]+):(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        result[key] = value;
      } else {
        // If not a clear key-value pair, add to a 'content' array
        if (!result.content) {
          result.content = [];
        }
        result.content.push(line.trim());
      }
    });

    return result;
  };

  return (
    <VStack spacing={4} w="100%">
      <Heading size="md">OCR Processing</Heading>

      {isProcessing ? (
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
          Extract Text & Convert to JSON
        </Button>
      )}
    </VStack>
  );
};

export default OcrProcessor;
