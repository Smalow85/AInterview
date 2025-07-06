const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT;

async function askGemini(promptText) {
  const prompt = buildPrompt(promptText);

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

function buildPrompt(userPrompt) {
  return `You are an AI assistant helping conduct technical interviews.
Answer the following question as a senior Java developer would.

Use a structured format: definition → key features → code example → use cases.

Respond ONLY with a valid JSON object, without Markdown formatting, no comments, no explanations.

Question:
${userPrompt}

Expected JSON Structure:
{
  "tags": ["..."],
  "data": "...",
  "header": "...",
  "summary": "...",
  "codeExamples": [
    {
      "language": "...",
      "code": "..."
    }
  ]
}`;
}

module.exports = {
  askGemini,
};
