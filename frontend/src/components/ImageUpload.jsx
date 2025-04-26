import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Text,
  VStack,
  Image,
  Center,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";

const ImageUpload = ({ onImageUpload }) => {
  const [preview, setPreview] = useState(null);
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const bgColor = useColorModeValue("gray.100", "gray.700");

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result);
          onImageUpload(file);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp"],
    },
    maxFiles: 1,
  });

  const resetImage = () => {
    setPreview(null);
    onImageUpload(null);
  };

  return (
    <VStack spacing={4} w="100%">
      {!preview ? (
        <Center
          {...getRootProps()}
          border="2px dashed"
          borderColor={borderColor}
          bg={bgColor}
          borderRadius="md"
          p={6}
          cursor="pointer"
          w="100%"
          h="200px"
          transition="all 0.2s"
          _hover={{ bg: useColorModeValue("gray.200", "gray.600") }}
        >
          <input {...getInputProps()} />
          <VStack spacing={2}>
            <Text fontSize="lg">
              {isDragActive
                ? "Drop the image here"
                : "Drag & drop an image here, or click to select one"}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Supports JPG, PNG, GIF, etc.
            </Text>
          </VStack>
        </Center>
      ) : (
        <Box position="relative" w="100%">
          <Image
            src={preview}
            alt="Preview"
            borderRadius="md"
            maxH="300px"
            mx="auto"
          />
          <Button
            position="absolute"
            top="2"
            right="2"
            size="sm"
            colorScheme="red"
            onClick={resetImage}
          >
            Remove
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default ImageUpload;
