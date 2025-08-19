const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT;

/**
 * @typedef {Object} ConversationRequest
 * @property {string} theme
 * @property {string[]} keySkills
 */

/**
 * @typedef {Object} RecommendedConversationRequest
 * @property {string} feedback
 * @property {string[]} topics
 */

/**
 * @param {ConversationRequest} request 
 * @param {string} sessionId 
 * @returns {Promise<Object>} parsed JSON объект с learningGoals и sessionId
 */
async function generateLearningObjectivesPlan(request, sessionId) {
  const prompt = buildLearningObjectivesPrompt(request, sessionId);

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
      headers: { 'Content-Type': 'application/json' }
    });

    const candidates = response.data?.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error("Gemini вернул пустой список кандидатов");
    }

    const rawText = candidates[0]?.content?.parts?.[0]?.text || '';
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error("Ответ Gemini не содержит корректный JSON");
    }

    const jsonCandidate = rawText.slice(jsonStart, jsonEnd + 1);

    try {
      return JSON.parse(jsonCandidate);
    } catch (err) {
      const cleaned = jsonCandidate.replace(/,\s*([}\]])/g, '$1'); // убираем лишние запятые
      return JSON.parse(cleaned);
    }

  } catch (error) {
    console.error("Gemini error:", error.message);
    return { error: error.message };
  }
}

/**
 * @param {RecommendedConversationRequest} request 
 * @param {string} sessionId 
 * @returns {Promise<Object>} parsed JSON объект с learningGoals и sessionId
 */
async function generateRecommendedLearningObjectivesPlan(request, sessionId) {
  const prompt = buildLearningObjectivesPromptWithFeedback(request, sessionId);

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
      headers: { 'Content-Type': 'application/json' }
    });

    const candidates = response.data?.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error("Gemini вернул пустой список кандидатов");
    }

    const rawText = candidates[0]?.content?.parts?.[0]?.text || '';
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error("Ответ Gemini не содержит корректный JSON");
    }

    const jsonCandidate = rawText.slice(jsonStart, jsonEnd + 1);

    try {ы
      return JSON.parse(jsonCandidate);
    } catch (err) {
      const cleaned = jsonCandidate.replace(/,\s*([}\]])/g, '$1'); // убираем лишние запятые
      return JSON.parse(cleaned);
    }

  } catch (error) {
    console.error("Gemini error:", error.message);
    return { error: error.message };
  }
}

/**
 * Формирует prompt для генерации учебных целей.
 * @param {ConversationRequest} req 
 * @param {string} sessionId 
 * @returns {string}
 */
function buildLearningObjectivesPrompt(req, sessionId) {
  return `Ты — AI-модуль для создания плана тематической беседы на профессиональную тему "${req.theme}".
Учитывай при генерации также ключевые навыки: ${req.keySkills.join(", ")}

Сформируй структуру JSON с ключевыми учебными целями (learning objectives) и основными вопросами/подтемами для глубокого понимания темы.
//Сгенерируй всего 1-2 цели для быстрой беседы.
Формат ответа - (строго JSON):
{
  "sessionId": "${sessionId}",
  "learningGoals": [
    "Understand recursion",
    "Explain call stack behavior",
    "Differentiate recursion and iteration"
  ]
}`;
}

/**
 * Формирует prompt для генерации учебных целей.
 * @param {RecommendedConversationRequest} req 
 * @param {string} sessionId 
 * @returns {string}
 */
function buildLearningObjectivesPromptWithFeedback(req, sessionId) {
  // Проверяем, что req.topics является массивом, иначе используем пустой массив
  const topics = Array.isArray(req.topics) ? req.topics.join(', ') : '';

  // Экранируем специальные символы в JSON-строках
  const sanitizedFeedback = JSON.stringify(req.feedback || '').slice(1, -1);
  const sanitizedTopics = JSON.stringify(topics).slice(1, -1);

  return `Ты — AI-модуль для создания плана тематической беседы на профессиональную тему "${req.theme}".

  Учти следующую информацию с прошлого интервью:
  - **Обратная связь (Feedback):** "${sanitizedFeedback}"
  - **Темы для повторения (Topics to review):** "${sanitizedTopics}"

  Сформируй структуру JSON с ключевыми учебными целями (learning objectives) для глубокого понимания темы, учитывая указанные данные.

  Пример формата ответа - (строго JSON):
  {
    "sessionId": "${sessionId}",
    "learningGoals": [
      "Strengthen understanding of JavaScript Promises and their lifecycle",
      "Master the difference between recursion and iteration",
      "Reinforce knowledge of API design patterns"
    ]
  }`;
}

module.exports = {
  generateLearningObjectivesPlan, generateRecommendedLearningObjectivesPlan
};