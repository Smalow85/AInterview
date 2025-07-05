const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT;

/**
 * @param {Object} request - объект с данными запроса
 * @param {string} request.jobTitle - должность
 * @param {string[]} request.keySkills - ключевые навыки
 * @param {number|string} request.requiredExperience - опыт
 * @returns {Promise<Object>} - возвращает распарсенный объект InterviewPlan
 */
async function generateInterviewPlan(request) {
  // Построение промпта
  const prompt = buildPrompt(request);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const root = response.data;
    const candidates = root.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error('Error: Gemini returned no candidates');
    }

    const content = candidates[0].content;
    const parts = content.parts;

    if (!Array.isArray(parts) || parts.length === 0) {
      throw new Error('Error: Gemini response is missing parts');
    }

    const generatedText = parts[0].text;

    const jsonStart = generatedText.indexOf('{');
    const jsonEnd = generatedText.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error('Error: Gemini response does not contain valid JSON structure');
    }

    const cleanedJson = generatedText.substring(jsonStart, jsonEnd + 1);

    const interviewPlan = JSON.parse(cleanedJson);

    return interviewPlan;

  } catch (error) {
    console.error('Error generating interview plan:', error.message);
    throw error;
  }
}

function buildPrompt(req) {
  return `
Ты — AI-собеседователь. Сгенерируй JSON-структуру плана технического интервью для позиции "${req.jobTitle}".
Учитывай ключевые навыки: ${req.keySkills.join(', ')}.
Опыт кандидата: ${req.requiredExperience} лет.

Ответ верни строго в JSON-формате, без закрывающих и открывающих кавычек, комментариев или пояснений. Структура:
{
  "phases": [
    {
      "name": "Название фазы",
      "questions": [
        {
          "text": "Вопрос текстом",
          "type": "Technical",
          "difficulty": "Medium",
          "expectedKeywords": ["ключ", "слова"],
          "evaluationCriteria": ["что оценивать"]
        }
      ]
    }
  ]
}
`;
}

module.exports = { generateInterviewPlan };