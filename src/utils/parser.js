export const parseAIResponse = (content) => {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonString);
};
