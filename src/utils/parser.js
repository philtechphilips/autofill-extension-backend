export const parseAIResponse = (content) => {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
    return JSON.parse(jsonString);
};

export const extractTextFromPDF = async (pdfBuffer) => {
    const Pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await Pdf(pdfBuffer);
    return data.text;
};

export const extractTextFromDOCX = async (docxBuffer) => {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    return result.value;
};
