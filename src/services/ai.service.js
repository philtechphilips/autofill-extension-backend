import OpenAI from "openai";
import config from "../config/index.js";
import { parseAIResponse } from "../utils/parser.js";

class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.apiKey,
      baseURL: config.ai.baseURL,
    });
  }

  buildPrompt({ fields, context, pageUrl, pageTitle, fillOnlyEmpty }) {
    const fillOnlyEmptyMode = !!fillOnlyEmpty;

    const emptyFieldsNote = fillOnlyEmptyMode
      ? `
IMPORTANT - Fill only empty: Each field may include a "currentValue" property. Only suggest values for fields where currentValue is missing, empty, or whitespace. Do NOT include in your JSON output any key for a field that already has a non-empty currentValue. Return a JSON object that contains only keys for fields that were empty (so the client can merge with existing values).`
      : `
Generate values for every field (overwrite all).`;

    const contextLines = [];
    if (pageUrl) contextLines.push(`Page: ${pageUrl}`);
    if (pageTitle) contextLines.push(`Page title: ${pageTitle}`);
    if (context) contextLines.push(`Purpose / form: ${context}`);

    const contextBlock = contextLines.length
      ? `Context:\n${contextLines.join("\n")}\n\nUse this context so values are coherent and relevant (e.g. job application → job-related text in textareas, contact form → contact-style content).\n\n`
      : "";

    return `
You are an expert AI Form Filler.
Analyze the following list of form fields and generate realistic test data.
${fillOnlyEmptyMode ? "Only suggest for fields that are currently empty (currentValue empty or missing)." : "Generate data for EVERY SINGLE field."}

${contextBlock || (context ? `The form is about: "${context}". Use this context to generate relevant data.\n\n` : "Generate realistic generic data based on the field labels.\n\n")}

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
  }

  async analyzeForm(formData) {
    const prompt = this.buildPrompt(formData);

    const response = await this.client.chat.completions.create({
      model: config.ai.model,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    return parseAIResponse(content);
  }
}

export default new AIService();
