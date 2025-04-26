import { useState } from "react";
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Divider,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import ImageUpload from "./components/ImageUpload";
import OcrProcessor from "./components/OcrProcessor";
import OpenAIProcessor from "./components/OpenAIProcessor";
import OpenAIServerProcessor from "./components/OpenAIServerProcessor";
import JsonDisplay from "./components/JsonDisplay";
import FhirDisplay from "./components/FhirDisplay";
import useOcrToFhir from "./hooks/useOcrToFhir";

function FormOcr() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [jsonResult, setJsonResult] = useState(null);
  const { fhirData, rawData, processOcrData } = useOcrToFhir();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.800", "gray.100");

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
    <Box bg={bgColor} color={textColor} minH="100vh" py={8}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>
              MediLock OCR
            </Heading>
            <Text fontSize="lg">
              Upload an image to extract text and convert it to FHIR format
            </Text>
          </Box>

          <Box
            borderWidth="1px"
            borderRadius="lg"
            p={6}
            bg={useColorModeValue("white", "gray.800")}
            shadow="md"
          >
            <ImageUpload onImageUpload={handleImageUpload} />
          </Box>

          {selectedImage && (
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={6}
              bg={useColorModeValue("white", "gray.800")}
              shadow="md"
            >
              <Tabs isFitted variant="enclosed">
                <TabList mb="1em">
                  <Tab>OpenAI Direct</Tab>
                  <Tab>OpenAI via Server</Tab>
                  <Tab>Tesseract OCR</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <OpenAIProcessor
                      image={selectedImage}
                      onOcrComplete={handleOcrComplete}
                    />
                  </TabPanel>
                  <TabPanel>
                    <OpenAIServerProcessor
                      image={selectedImage}
                      onOcrComplete={handleOcrComplete}
                    />
                  </TabPanel>
                  <TabPanel>
                    <OcrProcessor
                      image={selectedImage}
                      onOcrComplete={handleOcrComplete}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          )}

          {(fhirData || jsonResult) && (
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={6}
              bg={useColorModeValue("white", "gray.800")}
              shadow="md"
            >
              <Tabs isFitted variant="enclosed">
                <TabList mb="1em">
                  <Tab>FHIR Format</Tab>
                  <Tab>Raw JSON</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel p={0}>
                    <FhirDisplay jsonData={fhirData} rawData={rawData} />
                  </TabPanel>
                  <TabPanel p={0}>
                    <JsonDisplay jsonData={jsonResult} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          )}

          <Divider />

          <Box textAlign="center" opacity={0.7} fontSize="sm">
            <Text>
              &copy; {new Date().getFullYear()} MediLock OCR - Text to FHIR
              Converter
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export default FormOcr;
