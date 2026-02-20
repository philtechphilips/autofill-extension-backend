import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
});

app.post("/analyze-form", async (req, res) => {
    try {
        const { fields, context, fillOnlyEmpty } = req.body;

        if (!fields) {
            return res.status(400).json({ error: "No fields provided" });
        }

        const fillOnlyEmptyMode = !!fillOnlyEmpty;
        const emptyFieldsNote = fillOnlyEmptyMode
            ? `
IMPORTANT - Fill only empty: Each field may include a "currentValue" property. Only suggest values for fields where currentValue is missing, empty, or whitespace. Do NOT include in your JSON output any key for a field that already has a non-empty currentValue. Return a JSON object that contains only keys for fields that were empty (so the client can merge with existing values).`
            : `
Generate values for every field (overwrite all).`;

        const prompt = `
You are an expert AI Form Filler.
Analyze the following list of form fields and generate realistic test data.
${fillOnlyEmptyMode ? "Only suggest for fields that are currently empty (currentValue empty or missing)." : "Generate data for EVERY SINGLE field."}

${context ? `The form is about: "${context}". Use this context to generate relevant data.` : "Generate realistic generic data based on the field labels."}

Rules:
1. Return a JSON object where the keys match the 'key' property of each field.
2. For dropdowns (SELECT), pick a valid 'value' from the 'options' list provided.
3. For dates, strictly use the format 'YYYY-MM-DD'.
4. For phone numbers, use international format (e.g., +123456789).
5. ${fillOnlyEmptyMode ? "Only include keys for fields whose currentValue is empty or missing. Omit any key for a field that already has a value." : "Do not skip any fields. Fill everything even if it seems optional."}
6. If the context implies a specific type (e.g. "Category Form"), ensure "name" fields represent that category, not a person's name.
${emptyFieldsNote}

Fields:
${JSON.stringify(fields, null, 2)}

Only return the JSON object. No explanations, no markdown blocks.
`;

        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0].message.content;

        // Handle potential markdown wrapping
        let parsedData;
        try {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
            parsedData = JSON.parse(jsonString);
        } catch (parseErr) {
            console.error("Failed to parse AI response:", content);
            return res.status(500).json({
                error: "AI returned invalid JSON",
                raw: content
            });
        }

        res.json(parsedData);
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: "AI processing failed", details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
