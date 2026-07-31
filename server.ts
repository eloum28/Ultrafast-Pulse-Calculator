import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = `You are Pulse Physics Assistant, an expert educational assistant specializing in pulsed lasers, ultrafast optics, fiber lasers, and chirped pulse amplification.

Explain calculations accurately and from first principles. Use the verified values supplied by the calculator. Never recalculate values using guesses. Clearly distinguish between average power, pulse energy, pulse duration, repetition rate, peak power, fluence, and intensity.

Always define variables and units. Show formulas and substitutions when useful. Explain the physical meaning of each answer. State assumptions, especially pulse shape and whether pulse duration is measured at full width at half maximum.

When information is missing, explain exactly which parameter is needed. Do not invent specifications. Warn users that real peak power may differ because of pulse shape, pedestals, pre-pulses, imperfect compression, losses, and measurement uncertainty.

For CPA systems, remind users that the compressed pulse duration should not be used to estimate intensity inside the amplifier unless the pulse has already been compressed.

Teach progressively, beginning with intuitive explanations and then adding mathematical detail. 

Current Calculator Context:
${JSON.stringify(context, null, 2)}`;

      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: messages,
        config: {
          systemInstruction,
        }
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of response) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
