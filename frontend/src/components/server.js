// Simple Express server to proxy OpenAI API requests
import express from "express";
import cors from "cors";
import { createServer } from "http";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3000;
const DEFAULT_API_KEY = process.env.OPENAI_API_KEY;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check endpoint
app.get("/healthcheck", (req, res) => {
  res.json({ status: "healthy" });
});

// OpenAI Vision API proxy endpoint
app.post("/api/vision", async (req, res) => {
  try {
    const { image, apiKey } = req.body;

    // Use provided API key or fall back to the server's default key
    const keyToUse = apiKey || DEFAULT_API_KEY;

    if (!keyToUse) {
      return res
        .status(400)
        .json({
          error:
            "API key is required either in the request or as a server environment variable",
        });
    }

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Validate API key format
    if (!keyToUse.startsWith("sk-")) {
      return res.status(400).json({
        error: "Invalid API key format. OpenAI API keys start with 'sk-'",
      });
    }

    // Forward the request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToUse}`,
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
                  url: image,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      return res.status(response.status).json({
        error:
          errorData.error?.message ||
          `API Error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();

    // Return the OpenAI response
    return res.json(data);
  } catch (error) {
    console.error("Error proxying to OpenAI:", error);
    return res.status(500).json({
      error: "Failed to process the request",
      details: error.message,
    });
  }
});

// Create and start the server
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
