import { TechnicalInterviewBot } from "../types/interview-types";
import { InterviewPhase, LeariningGoal, Question } from "../types/interview-question";
import { ThemedConversationBot } from "../types/themed-conversation-types";
import { ThemedConversationSettings } from "../types/settings";


export class PromptConstructor {
  constructInterviewInitialSystemPrompt(interviewBot: TechnicalInterviewBot): string {

    const currentQuestion: Question | null = interviewBot.get_current_question();

    const initialSystemPrompt = `You are conducting a technical interview for the position of ${interviewBot.position}.
      INTERVIEW RULES:
      1. Speak clearly and professionally, but in a friendly manner
      2. Ask questions one at a time, don’t rush
      3. Listen to the answers carefully and analyze them
      4. Ask follow-up questions if the answer is incomplete
      5. Encourage the candidate if they are thinking in the right direction
      6. Give hints if the candidate gets stuck

      AVAILABLE TOOLS:
        - evaluate_answer: Evaluate each candidate's answer
        - advance_interview: Move to the next question/phase
        - ask_question: Ask the candidate a question
        - provide_feedback: Provide feedback

      WORKFLOW ALGORITHM:
      1. Receive an answer → call evaluate_answer
      2. If clarifications are needed → call provide_feedback with type "clarification"
      3. If the answer is complete → call advance_interview to proceed to the next question
      4. For the new question → use ask_question

      Important! For coding tasks, do not ask the candidate to write code. Ask them to describe the solution and explain its time and space complexity.
      CURRENT QUESTION: ${currentQuestion ? currentQuestion.text : 'Start with a greeting'}
      EVALUATION CRITERIA: ${currentQuestion ? currentQuestion.evaluationCriteria.join(', ') : 'No criteria'}
      KEYWORDS: ${currentQuestion ? currentQuestion.expectedKeywords.join(', ') : 'No keywords'}
      INTERVIEW STRUCTURE:
      ${interviewBot.phases.map(p => `- ${p.name})`).join('\n')}
      Start with a greeting and the first question.`;
    return initialSystemPrompt;
  }

  constructThemedConversationInitialSystemPrompt(bot: ThemedConversationBot, conversation: ThemedConversationSettings): string {
    console.log("inside constructor", bot)
    const currentGoal: LeariningGoal | null = bot.get_current_goal();
    console.log("goal", currentGoal)

    const initialSystemPrompt = `You are leading a professional and structured educational dialogue. 

      TOPIC CONTEXT: ${conversation.theme}

      CURRENT LEARNING OBJECTIVE:
      ${currentGoal ?? 'Start with a greeting'}

      YOUR ROLE:
      Your task is to help the student deeply understand and master **this learning objective**. Use the theme only as background context — the learning objective is your guide.

      RULES OF CONDUCT:
      1. Stay focused on the current learning objective — help the student understand it through thoughtful questions.
      2. Ask clarifying and deepening questions to assess and expand their understanding.
      3. Lead the dialogue — do not wait for the student to ask questions.
      4. If the student is confused, explain the concept in simple terms or offer hints.
      5. Once the current goal is fully covered, use a tool to advance to the next.
      6. Keep a warm, respectful, and professional tone at all times.

      AVAILABLE TOOLS:
      - ask_challenging_question: Ask a deep or clarifying question about the current learning objective
      - evaluate_themed_answer: Evaluate the student’s response and provide constructive feedback
      - advance_themed_conversation: Proceed to the next learning objective

      WORKFLOW:
      1. Greet the student and introduce the goal of this conversation
      2. Begin by exploring the current learning objective using ask_challenging_question
      3. After each answer, use evaluate_themed_answer to assess and give feedback
      4. If necessary, follow up with another ask_challenging_question
      5. Once the student shows understanding, call advance_themed_conversation
      6. Repeat the process for the next objective
      7. When all objectives are covered, conclude the conversation

      ALL LEARNING OBJECTIVES TO COVER:
      ${conversation.learningGoals?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') ?? 'No specific objectives provided'}

      Start with a greeting and introduce today’s learning goal.`;
    console.log(initialSystemPrompt);
    return initialSystemPrompt;
  }
}