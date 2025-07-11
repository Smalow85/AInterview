import {
  FunctionDeclaration,
  Type,
} from "@google/genai";

export const evaluate_answer_declaration: FunctionDeclaration = {
  name: "evaluate_answer",
  description: "Оценить ответ кандидата и определить следующие шаги",
  parameters: {
    type: Type.OBJECT,
    properties: {
      score: {
        type: Type.STRING,
        description: "Оценка ответа от 1 до 10",
        minimum: 1,
        maximum: 10
      },
      keywords_found: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Найденные ключевые слова в ответе"
      },
      completeness: {
        type: Type.NUMBER,
        description: "Полнота ответа от 0 до 1",
        minimum: 0,
        maximum: 1
      },
      needs_followup: {
        type: Type.BOOLEAN,
        description: "Нужны ли уточняющие вопросы"
      },
      followup_question: {
        type: Type.STRING,
        description: "Уточняющий вопрос, если needs_followup = true"
      },
      next_action: {
        type: Type.STRING,
        enum: ["ask_followup", "next_question", "next_phase", "complete_interview"],
        description: "Следующее действие в интервью"
      }
    },
    required: ["score", "completeness", "needs_followup", "next_action"]
  }
};

export const advance_interview_declaration: FunctionDeclaration = {
  name: "advance_interview",
  description: "Перейти к следующему вопросу или фазе интервью",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["next_question", "next_phase", "complete"],
        description: "Тип перехода"
      },
      reason: {
        type: Type.STRING,
        description: "Причина перехода"
      }
    },
    required: ["action"]
  }
};

export const ask_question: FunctionDeclaration = {
  name: "ask_question",
  description: "Задать текущий вопрос кандидату",
  parameters: {
    type: Type.OBJECT,
    properties: {
      question_text: {
        type: Type.STRING,
        description: "Текст вопроса для кандидата"
      },
      additional_context: {
        type: Type.STRING,
        description: "Дополнительный контекст или пояснения к вопросу"
      }
    },
    required: ["question_text"]
  }
};

export const provide_feedback: FunctionDeclaration = {
  name: "provide_feedback",
  description: "Дать обратную связь кандидату",
  parameters: {
    type: Type.OBJECT,
    properties: {
      feedback_type: {
        type: Type.STRING,
        enum: ["encouragement", "hint", "clarification", "final_feedback"],
        description: "Тип обратной связи"
      },
      message: {
        type: Type.STRING,
        description: "Сообщение с обратной связью"
      }
    },
    required: ["feedback_type", "message"]
  }
};

export const advanceThemedConversation: FunctionDeclaration = {
  name: "advance_themed_conversation",
  description: "Перейти к следующему этапу тематической беседы",
  parameters: {
    type: Type.OBJECT,
    properties: {
      nextTopic: {
        type: Type.STRING,
        description: "Тема следующего этапа беседы"
      },
      reason: {
        type: Type.STRING,
        description: "Причина перехода к следующей теме"
      }
    },
    required: ["nextTopic"]
  }
};

export const evaluateThemedAnswer: FunctionDeclaration = {
  name: "evaluate_themed_answer",
  description: "Оценить ответ на вопрос в тематической беседе",
  parameters: {
    type: Type.OBJECT,
    properties: {
      score: {
        type: Type.NUMBER,
        description: "Оценка ответа (0-10)",
        minimum: 0,
        maximum: 10
      },
      relevance: {
        type: Type.NUMBER,
        description: "Релевантность ответа теме (0-1)",
        minimum: 0,
        maximum: 1
      },
      depth: {
        type: Type.NUMBER,
        description: "Глубина ответа (0-1)",
        minimum: 0,
        maximum: 1
      },
      nextAction: {
        type: Type.STRING,
        enum: ["continue", "askFollowUp", "changeTopic"],
        description: "Следующее действие: продолжить, задать уточняющий вопрос, изменить тему"
      }
    },
    required: ["score", "relevance", "depth", "nextAction"]
  }
};

export const askChallengingQuestion: FunctionDeclaration = {
  name: "ask_challenging_question",
  description: "Задать сложный вопрос для углубления обсуждения",
  parameters: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "Текст сложного вопроса"
      },
      topic: {
        type: Type.STRING,
        description: "Тема сложного вопроса"
      }
    },
    required: ["question"]
  }
};
