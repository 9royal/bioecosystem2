import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Key from environment
  const apiKey = process.env.GEMINI_API_KEY;

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for grading
  app.post("/api/grade", async (req, res) => {
    try {
      const { answer } = req.body;
      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const prompt = `
        你是一位國中生物老師。請根據學生的回答進行評比。
        題目是：根據「生態系雨量溫度圖」（甲：沙漠、乙：草原、丙：森林、丁：森林），判斷甲乙丙丁可能是什麼生態系，理由是什麼？
        判斷標準：
        1. 年雨量低於 250mm 為沙漠（甲）。
        2. 年雨量 250mm ~ 750mm 為草原（乙）。
        3. 年雨量超過 750mm 可能形成森林（丙、丁）。
        
        評分標準：
        - 四個生態系名稱都正確且理由（根據雨量判斷）正確：100分。
        - 生態系名稱正確但理由錯誤或缺少理由：60分。
        - 生態系名稱部分正確：視情況給予 0-40 分。
        
        學生回答："""${answer}"""
      `;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
            },
            required: ["score", "feedback"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text from Gemini");
      }

      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to call Gemini API" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
