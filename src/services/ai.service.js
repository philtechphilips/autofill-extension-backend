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

    buildPrompt({ fields, context, pageUrl, pageTitle, fillOnlyEmpty, profileData, randomSeed }) {
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

        // Build user profile section if available
        let userDataSection = "";
        if (profileData) {
            // Check if this is a CV-based profile (has more detailed info)
            const isCV = profileData.isCV || profileData.summary || profileData.work_experience;

            userDataSection = `
USER'S REAL DATA (Use this information to fill the form accurately):
${JSON.stringify(profileData, null, 2)}

IMPORTANT: Use the user's REAL information from their profile above. Match fields intelligently:
- For name fields, use their actual name (first_name, last_name, full_name)
- For email/phone, use their actual contact info
- For work experience questions, use their job_title, company, work_experience
- For education questions, use their degree, university, field_of_study
- For skills, use their skills, technical_skills, programming_languages
- For cover letters/summaries, write personalized content based on their summary and experience
- For "why do you want to work here" type questions, craft a response using their actual background
${isCV ? "- This profile was created from a CV/Resume, so it contains detailed professional information" : ""}

`;
        }

        // Add randomization instruction when no profile is selected
        const randomizationNote = !profileData
            ? `
IMPORTANT - RANDOMIZATION: Generate COMPLETELY DIFFERENT and UNIQUE data each time. This is request #${randomSeed}.
- Use different names, emails, phone numbers, addresses each time
- Vary the style and content of text responses
- Pick different options for dropdowns, radios, and checkboxes
- Be creative and diverse - never repeat the same data pattern
`
            : "";

        return `
You are an expert AI Form Filler.
${userDataSection ? "You have access to the user's real CV/profile data. Use it to fill forms accurately with their actual information." : "Analyze the following list of form fields and generate realistic test data."}
${fillOnlyEmptyMode ? "Only suggest for fields that are currently empty (currentValue empty or missing)." : "Generate data for EVERY SINGLE field."}
${randomizationNote}
${userDataSection}${contextBlock || (context ? `The form is about: "${context}". Use this context to generate relevant data.\n\n` : userDataSection ? "" : "Generate realistic generic data based on the field labels.\n\n")}

Rules:
1. Return a JSON object where the keys match the 'key' property of each field.
2. For dropdowns (SELECT), pick a valid 'value' from the 'options' list provided.
3. For dates, strictly use the format 'YYYY-MM-DD'.
4. For phone numbers, use international format (e.g., +123456789).
5. ${fillOnlyEmptyMode ? "Only include keys for fields whose currentValue is empty or missing. Omit any key for a field that already has a value." : "Do not skip any fields. Fill everything even if it seems optional."}
6. ${userDataSection ? "ALWAYS prefer the user's real data over generating fake data. Only generate content when the user's data doesn't have relevant information." : 'If the context implies a specific type (e.g. "Category Form"), ensure "name" fields represent that category, not a person\'s name.'}
${emptyFieldsNote}

Fields:
${JSON.stringify(fields, null, 2)}

Only return the JSON object. No explanations, no markdown blocks.
`;
    }

    async analyzeForm(formData) {
        const { fields } = formData;

        // For large forms (>20 fields), split into parallel batches for faster processing
        if (fields && fields.length > 20) {
            return this.analyzeFormParallel(formData);
        }

        // Add random seed for variety when no profile is selected
        const randomSeed = Date.now() + Math.floor(Math.random() * 100000);
        const prompt = this.buildPrompt({ ...formData, randomSeed });

        // Use higher temperature when no profile to get more varied results
        const temperature = formData.profileData ? 0.3 : 0.9;

        const response = await this.client.chat.completions.create({
            model: config.ai.model,
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: 4000,
        });

        const content = response.choices[0].message.content;
        return parseAIResponse(content);
    }

    async analyzeFormParallel(formData) {
        const { fields, ...rest } = formData;
        const BATCH_SIZE = 15;
        const batches = [];

        // Split fields into batches
        for (let i = 0; i < fields.length; i += BATCH_SIZE) {
            batches.push(fields.slice(i, i + BATCH_SIZE));
        }

        // Process batches in parallel
        const results = await Promise.all(
            batches.map(async (batchFields) => {
                const randomSeed = Date.now() + Math.floor(Math.random() * 100000);
                const prompt = this.buildPrompt({ ...rest, fields: batchFields, randomSeed });
                const temperature = formData.profileData ? 0.3 : 0.9;

                const response = await this.client.chat.completions.create({
                    model: config.ai.model,
                    messages: [{ role: "user", content: prompt }],
                    temperature,
                    max_tokens: 2000,
                });

                return parseAIResponse(response.choices[0].message.content);
            })
        );

        // Merge all batch results into one object
        return results.reduce((merged, result) => ({ ...merged, ...result }), {});
    }

    buildEnhancePrompt({ text, fieldLabel, context, enhanceType }) {
        const typeInstructions = {
            professional: "Make it more professional, polished, and business-appropriate.",
            concise: "Make it more concise and to the point while keeping key information.",
            detailed: "Expand with more relevant details and examples.",
            friendly: "Make it warmer and more personable while staying professional.",
            formal: "Make it more formal and suitable for official communications.",
            creative: "Make it more engaging and creative while staying relevant.",
        };

        const instruction = typeInstructions[enhanceType] || typeInstructions.professional;

        return `You are an expert writing assistant helping users improve their form responses.

Task: Improve the following text that was written for a form field.

Field Label: "${fieldLabel || "Text field"}"
${context ? `Form Context: ${context}` : ""}

Original Text:
"""
${text}
"""

Instructions:
1. ${instruction}
2. Keep the same general meaning and intent.
3. Fix any grammar or spelling errors.
4. Make it appropriate for the field type (e.g., cover letter, bio, description).
5. Keep a similar length unless expanding/condensing was requested.
6. Do NOT add placeholder text like [Company Name] - use what's provided or make reasonable assumptions.

Return ONLY the improved text. No explanations, no quotes around it, no markdown.`;
    }

    async enhanceText({ text, fieldLabel, context, enhanceType = "professional" }) {
        if (!text || text.trim().length < 10) {
            throw new Error("Text is too short to enhance. Please write at least a sentence.");
        }

        const prompt = this.buildEnhancePrompt({ text, fieldLabel, context, enhanceType });

        const response = await this.client.chat.completions.create({
            model: config.ai.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
        });

        const enhanced = response.choices[0].message.content.trim();
        return { original: text, enhanced };
    }

    buildCVParsePrompt(cvText) {
        return `You are an expert CV/Resume parser with extensive HR and recruitment experience. Your task is to intelligently analyze and extract ALL information from this CV/Resume.

CV Content:
"""
${cvText}
"""

IMPORTANT: Do NOT rely on specific section headers. CVs use many different formats and naming conventions. Instead:
1. INTELLIGENTLY DETECT what type of information each section contains based on its CONTENT, not its header
2. A section titled "Career History" = work experience. "Academic Background" = education. "Competencies" = skills. etc.
3. Look for PATTERNS: dates + company + role = work experience. Degree + institution = education. Names + contact info at end = references.
4. Extract EVERYTHING - if you see information, capture it even if you're unsure which category it belongs to.

Return a JSON object with this FLEXIBLE structure. Create sections dynamically based on what you find:

{
  "personal": {
    "full_name": "string",
    "first_name": "string", 
    "last_name": "string",
    "email": "string",
    "phone": "string",
    "phone_alt": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string",
    "linkedin": "string",
    "github": "string",
    "twitter": "string",
    "website": "string",
    "portfolio": "string",
    "date_of_birth": "string",
    "nationality": "string",
    "gender": "string",
    "marital_status": "string",
    "summary": "string (professional summary, objective, profile, about me - whatever it's called)",
    "headline": "string",
    "availability": "string",
    "salary_expectation": "string",
    "willing_to_relocate": "string"
  },
  
  "work_experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "is_current": "boolean",
      "employment_type": "string",
      "description": "string",
      "responsibilities": ["string"],
      "achievements": ["string"],
      "technologies": ["string"]
    }
  ],
  
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "start_date": "string",
      "end_date": "string",
      "gpa": "string",
      "grade": "string",
      "honors": "string",
      "thesis": "string",
      "coursework": ["string"],
      "activities": ["string"]
    }
  ],
  
  "skills": {
    "technical": ["string"],
    "programming": ["string"],
    "frameworks": ["string"],
    "tools": ["string"],
    "databases": ["string"],
    "cloud": ["string"],
    "soft_skills": ["string"],
    "methodologies": ["string"],
    "other": ["string"]
  },
  
  "languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ],
  
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "expiry": "string",
      "credential_id": "string"
    }
  ],
  
  "projects": [
    {
      "name": "string",
      "description": "string",
      "role": "string",
      "technologies": ["string"],
      "url": "string",
      "date": "string"
    }
  ],
  
  "references": [
    {
      "name": "string",
      "title": "string",
      "company": "string",
      "relationship": "string",
      "email": "string",
      "phone": "string",
      "available_on_request": "boolean"
    }
  ],
  
  "awards": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "description": "string"
    }
  ],
  
  "publications": [
    {
      "title": "string",
      "publisher": "string",
      "date": "string",
      "authors": ["string"],
      "url": "string"
    }
  ],
  
  "volunteer": [
    {
      "organization": "string",
      "role": "string",
      "date": "string",
      "description": "string"
    }
  ],
  
  "memberships": [
    {
      "organization": "string",
      "role": "string",
      "date": "string"
    }
  ],
  
  "courses": [
    {
      "name": "string",
      "provider": "string",
      "date": "string"
    }
  ],
  
  "interests": ["string"],
  
  "additional_sections": [
    {
      "section_title": "string (original section name from CV)",
      "content": "string or array (the content of that section)"
    }
  ],
  
  "additional_info": {
    "driving_license": "string",
    "visa_status": "string",
    "security_clearance": "string",
    "military": "string",
    "other": "string"
  }
}

CRITICAL RULES:
1. DETECT sections by CONTENT, not headers. "What I've Done" = work experience. "My Journey" = career history. "Competencies" = skills.
2. Extract EVERYTHING. If information exists, capture it somewhere.
3. Use "additional_sections" for anything that doesn't fit standard categories - preserve the original section title.
4. For references: look for names followed by job titles, companies, and contact details. Also detect "available upon request" phrases.
5. Dates should be normalized to YYYY-MM or YYYY format where possible.
6. Work experience should be in reverse chronological order (most recent first).
7. If a summary/objective/profile exists, extract it verbatim. If not, generate a 2-3 sentence summary.
8. Skills should be intelligently categorized even if the CV doesn't categorize them.
9. Don't leave any information behind - if you see it, extract it.
10. For any section you don't recognize, add it to additional_sections with its original title.

Return ONLY valid JSON. No markdown, no explanations.`;
    }

    async parseCV(cvText) {
        if (!cvText || cvText.trim().length < 50) {
            throw new Error("CV content is too short. Please provide more content.");
        }

        const prompt = this.buildCVParsePrompt(cvText);

        const response = await this.client.chat.completions.create({
            model: config.ai.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000,
            temperature: 0.1, // Low temperature for accurate extraction
        });

        const content = response.choices[0].message.content;
        return parseAIResponse(content);
    }
}

export default new AIService();
