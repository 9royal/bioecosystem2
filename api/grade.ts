import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { answer } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!answer) {
    return res.status(400).json({ error: "Answer is required" });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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
      model: "gemini-3.5-flash",
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

    let text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    // Clean up markdown markers if present
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();

    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to call Gemini API" });
  }
}
