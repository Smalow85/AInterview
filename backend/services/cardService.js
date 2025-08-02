const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT;

async function askGemini(promptText, language) {
  const prompt = buildPrompt(promptText, language);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    const response = await axios.post(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, requestBody, {
      headers: { 'Content-Type': 'application/json' },
    });

    const candidates = response.data?.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error("No candidates returned by Gemini");
    }

    const rawText = candidates[0]?.content?.parts?.[0]?.text || '';
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error("Gemini response does not contain valid JSON");
    }

    const jsonCandidate = rawText.slice(jsonStart, jsonEnd + 1);

    try {
      return JSON.parse(jsonCandidate);
    } catch (err) {
      // Попробуем немного почистить JSON от лишних запятых перед } и ]
      const cleaned = jsonCandidate.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(cleaned);
    }

  } catch (error) {
    console.error("❌ Gemini error:", error.message);
    return { error: error.message };
  }
}

function buildPrompt(userPrompt, language) {
  return `You are a highly knowledgeable AI assistant simulating a **Senior or Lead Developer** conducting technical interviews.

  Provide a **detailed**, **expert-level**, and **professionally structured** response to the following technical question. Ensure your answer reflects deep practical experience and industry best practices.

  ### Response format requirements:
  - Use the following structure:
    1. **Definition** – clear, concise, and technically accurate.
    2. **Key Features / Concepts** – highlight essential characteristics, pros/cons, patterns, and edge cases.
    3. **Code Example** – idiomatic, production-grade Java code (use latest best practices and appropriate APIs).
    4. **Use Cases / Real-world Applications** – where, when, and why this is used, including architectural or performance trade-offs.
  - Use professional tone and terminology suitable for senior-level technical interviews.
  - Focus on clarity, precision, and technical depth.
  - Avoid redundancy or superficial explanations.

  ### Response output constraints:
  - Respond strictly with a **valid JSON object**
  - No Markdown, comments, or explanatory text outside of the JSON
  - The JSON must follow this structure:

  {
    "tags": ["Java", "Concurrency", "Multithreading"], // adjust to topic
    "header": "Clear title of the concept or topic",
    "summary": "Well-structured overview, including definition, key features, and usage insights",
    "data": "In-depth technical explanation with context, trade-offs, and advanced considerations",
    "codeExample":
      {
        "language": "java",
        "code": "/* idiomatic code example here */"
      }
  }

  Important! provide answer in ${language} language.

  ### Interview Question:
  ${userPrompt}`;
}


module.exports = {
  askGemini,
};
