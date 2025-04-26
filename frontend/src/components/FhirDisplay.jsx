import {
  Box,
  Heading,
  Button,
  Code,
  Flex,
  useClipboard,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";

const FhirDisplay = ({ jsonData, rawData }) => {
  const { hasCopied, onCopy } = useClipboard(
    jsonData ? JSON.stringify(jsonData, null, 2) : ""
  );

  const { hasCopied: hasRawCopied, onCopy: onRawCopy } = useClipboard(
    rawData ? JSON.stringify(rawData, null, 2) : ""
  );

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (!jsonData || Object.keys(jsonData).length === 0) {
    return null;
  }

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={2}>
        <Heading size="md">FHIR Bundle Result</Heading>
        <Button size="sm" onClick={onCopy} colorScheme="teal">
          {hasCopied ? "Copied!" : "Copy"}
        </Button>
      </Flex>

      <Tabs isFitted variant="enclosed" colorScheme="blue" mt={4}>
        <TabList>
          <Tab>FHIR Format</Tab>
          <Tab>Raw Data</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0} mt={2}>
            <Box
              p={4}
              borderRadius="md"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              overflowX="auto"
              maxHeight="500px"
            >
              <Code display="block" whiteSpace="pre" p={2} overflowX="auto">
                {JSON.stringify(jsonData, null, 2)}
              </Code>
            </Box>
          </TabPanel>
          <TabPanel p={0} mt={2}>
            <Flex justify="flex-end" mb={2}>
              <Button size="sm" onClick={onRawCopy} colorScheme="teal">
                {hasRawCopied ? "Copied!" : "Copy Raw Data"}
              </Button>
            </Flex>
            <Box
              p={4}
              borderRadius="md"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              overflowX="auto"
              maxHeight="500px"
            >
              <Code display="block" whiteSpace="pre" p={2} overflowX="auto">
                {JSON.stringify(rawData, null, 2)}
              </Code>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FhirDisplay;
