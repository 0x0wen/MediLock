import {
  Box,
  Heading,
  Button,
  Code,
  Flex,
  useClipboard,
  useColorModeValue,
} from "@chakra-ui/react";

const JsonDisplay = ({ jsonData }) => {
  const { hasCopied, onCopy } = useClipboard(
    jsonData ? JSON.stringify(jsonData, null, 2) : ""
  );

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (!jsonData || Object.keys(jsonData).length === 0) {
    return null;
  }

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={2}>
        <Heading size="md">JSON Result</Heading>
        <Button size="sm" onClick={onCopy} colorScheme="teal">
          {hasCopied ? "Copied!" : "Copy"}
        </Button>
      </Flex>

      <Box
        p={4}
        borderRadius="md"
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        overflowX="auto"
      >
        <Code display="block" whiteSpace="pre" p={2} overflowX="auto">
          {JSON.stringify(jsonData, null, 2)}
        </Code>
      </Box>
    </Box>
  );
};

export default JsonDisplay;
