import { GenAILiveClient } from "./genai-live-client";
import { LiveClientOptions } from "../types";
import { ChatMessage } from "../types/chat-message";
import { ResponseCard } from "../types/response-card";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUserSettingsAsync } from "./store-settings";
import { TechnicalInterviewBot } from "../types/interview-types";
import { Question } from "../types/interview-question";
import { ThemedConversationBot } from "../types/themed-conversation-types";

export class EnhancedGenAILiveClient extends GenAILiveClient {
    private accumulatedText: string = "";
    private accumulatedInputText: string = "";
    public interviewBot: TechnicalInterviewBot;
    public conversationBot: ThemedConversationBot;
    private followUpCount: number = 0;
    private readonly maxFollowUps: number = 3;
    private lastUserAnswer: string = "";

    constructor(options: LiveClientOptions) {
        super(options);
        this.interviewBot = new TechnicalInterviewBot();
        this.conversationBot = new ThemedConversationBot();
        this.onmessage = this.onmessage.bind(this);
        this.handleTurnComplete = this.handleTurnComplete.bind(this);
        this.sendRealtimeInput = this.sendRealtimeInput.bind(this);
        this.saveResumptionTokenToDatabase = this.saveResumptionTokenToDatabase.bind(this);
    }

    protected async onmessage(message: any) {
        await super.onmessage(message);
        if (message.toolCall) {
            this.handleToolCall(message.toolCall);
            return;
        }
        if (message.sessionResumptionUpdate) {
            if (message.sessionResumptionUpdate.resumable && message.sessionResumptionUpdate.newHandle) {
                const userSettings = await getCurrentUserSettingsAsync();
                this.saveResumptionTokenToDatabase({ sessionId: userSettings.activeSessionId, resumptionToken: message.sessionResumptionUpdate.newHandle })
            }
        }

        if (message.serverContent) {
            if ("inputTranscription" in message.serverContent) {
                this.accumulatedInputText += message.serverContent.inputTranscription.text;
            }
            if ("outputTranscription" in message.serverContent) {
                this.accumulatedText += message.serverContent.outputTranscription.text;
            }
            if ("turnComplete" in message.serverContent && message.serverContent.turnComplete) {
                await this.handleTurnComplete();
            }
        }
    }

    private async handleTurnComplete() {
        const userSettings = await getCurrentUserSettingsAsync();
        if (this.accumulatedInputText) {
            await this.saveUserMessage(userSettings.activeSessionId, this.accumulatedInputText);
            this.lastUserAnswer = this.accumulatedInputText;
            this.accumulatedInputText = '';
        }

        if (this.accumulatedText) {
            await this.saveBotMessage(userSettings.activeSessionId, this.accumulatedText);
            this.accumulatedText = '';
        }

        this.emit("turncomplete");
    }

    private async handleToolCall(toolCall: any) {
        console.log("Received tool call:", toolCall);

        if (Array.isArray(toolCall)) {
            for (const call of toolCall) {
                await this.processToolCall(call);
            }
        } else if (toolCall && toolCall.functionCalls && Array.isArray(toolCall.functionCalls)) {
            for (const call of toolCall.functionCalls) {
                await this.processToolCall(call);
            }
        } else {
            await this.processToolCall(toolCall);
        }
    }

    private async processToolCall(toolCall: any) {
        console.log("Received tool call:", toolCall);

        const functionName = toolCall.functionCall?.name || toolCall.name;
        const args = toolCall.functionCall?.args || toolCall.args || {};
        const toolCallId = toolCall.id;

        let functionResponse: any = {
            id: toolCallId,
            name: functionName,
            response: { status: "success" }
        };

        try {
            switch (functionName) {
                case "evaluate_answer":
                    functionResponse.response = await this.handleEvaluateAnswer(args);
                    break;

                case "advance_interview":
                    functionResponse.response = await this.handleAdvanceInterview(args);
                    break;

                case "ask_question":
                    functionResponse.response = await this.handleAskQuestion(args);
                    break;

                case "provide_feedback":
                    functionResponse.response = await this.handleProvideFeedback(args);
                    break;

                case "advance_themed_conversation":
                    functionResponse.response = await this.handleAdvanceThemedConversation(args);
                    break;

                case "evaluate_themed_answer":
                    functionResponse.response = await this.handleEvaluateThemedAnswer(args);
                    break;

                case "ask_challenging_question":
                    functionResponse.response = await this.handleAskChallengingQuestion(args);
                    break;
                default:
                    console.warn(`Unknown function call: ${functionName}`);
                    functionResponse.response = {
                        status: "error",
                        error: `Unknown function: ${functionName}`
                    };
            }
        } catch (error) {
            console.error(`Error handling tool call ${functionName}:`, error);
            functionResponse.response = {
                status: "error",
                error: error
            };
        }

        this.sendToolResponse({ functionResponses: [functionResponse] });
    }

    private async handleEvaluateAnswer(args: any) {
        if (!this.lastUserAnswer) {
            return { status: "error", error: "No user answer to evaluate" };
        }

        this.saveEvaluation({
            score: args.score,
            keywords_found: args.keywords_found || [],
            needs_followup: args.needs_followup,
            next_action: args.next_action
        });

        if (args.next_action === "ask_followup") {
            this.followUpCount++;
        } else {
            this.followUpCount = 0;
        }

        const currentQuestion = this.interviewBot.get_current_question();

        return {
            status: "success",
            evaluation: {
                score: args.score,
                completeness: args.completeness,
                keywords_found: args.keywords_found || [],
                needs_followup: args.needs_followup,
                followup_count: this.followUpCount,
                max_followups_reached: this.followUpCount >= this.maxFollowUps,
                current_question: currentQuestion?.text || "No current question",
                suggested_action: args.next_action
            }
        };
    }

    private async handleAdvanceInterview(args: any) {
        const action = args.action;

        switch (action) {
            case "next_question":
                this.interviewBot.advance_to_next_question();
                const nextQuestion = this.interviewBot.get_current_question();

                if (nextQuestion) {
                    await this.updateSystemInstructionForGemini(nextQuestion);
                    return {
                        status: "success",
                        action: "next_question",
                        question: {
                            text: nextQuestion.text,
                            keywords: nextQuestion.expectedKeywords,
                            criteria: nextQuestion.evaluationCriteria
                        },
                        phase: this.interviewBot.current_phase
                    };
                } else {
                    return {
                        status: "success",
                        action: "interview_complete",
                        message: "No more questions available"
                    };
                }

            case "next_phase":
                this.interviewBot.advance_to_next_question();
                const phaseQuestion = this.interviewBot.get_current_question();

                if (phaseQuestion) {
                    await this.updateSystemInstructionForGemini(phaseQuestion);
                    return {
                        status: "success",
                        action: "next_phase",
                        new_phase: this.interviewBot.current_phase,
                        question: {
                            text: phaseQuestion.text,
                            keywords: phaseQuestion.expectedKeywords,
                            criteria: phaseQuestion.evaluationCriteria
                        }
                    };
                } else {
                    return {
                        status: "success",
                        action: "interview_complete",
                        message: "No more phases available"
                    };
                }

            case "complete":
                await this.finalizeInterview();
                return {
                    status: "success",
                    action: "interview_complete",
                    message: "Interview completed successfully"
                };

            default:
                return {
                    status: "error",
                    error: `Unknown action: ${action}`
                };
        }
    }

    private async handleAskQuestion(args: any) {
        const userSettings = await getCurrentUserSettingsAsync();
        const questionText = args.question_text;
        const additionalContext = args.additional_context || "";
        this.addQuestionCard(userSettings.activeSessionId, questionText);

        this.interviewBot.questionSent = true;

        return {
            status: "success",
            question_asked: questionText,
            additional_context: additionalContext,
            waiting_for_answer: true
        };
    }

    private async handleProvideFeedback(args: any) {
        const feedbackType = args.feedback_type;
        const message = args.message;

        console.log(`Feedback [${feedbackType}]: ${message}`);

        return {
            status: "success",
            feedback_type: feedbackType,
            message: message,
            timestamp: new Date().toISOString()
        };
    }

    public async startInterview() {
        if (!this.interviewBot.active) {
            this.interviewBot.active = true;

            const firstQuestion = this.interviewBot.get_current_question();
            if (firstQuestion) {
                await this.updateSystemInstructionForGemini(firstQuestion);

                const welcomeMessage = `Привет! Начинаем техническое интервью на позицию ${this.interviewBot.position}.
                Интервью состоит из ${this.interviewBot.phases.length} фаз.
                Используй функцию ask_question чтобы задать первый вопрос.`;

                await this.send({ text: welcomeMessage }, true);
            }
        }
    }

    private saveEvaluation(evaluation: any) {
        if (this.interviewBot.answers.length > 0) {
            const lastAnswer = this.interviewBot.answers[this.interviewBot.answers.length - 1];
            lastAnswer.evaluation_score = evaluation.score || 0;
            lastAnswer.notes = JSON.stringify(evaluation);
            console.log("Evaluation saved:", lastAnswer);
        }
    }

    private async saveUserMessage(sessionId: string, message: string) {
        const chatMessage: ChatMessage = {
            sender: 'user',
            message: message,
            id: uuidv4(),
            sessionId: sessionId
        };
        this.emit('messageAdded', chatMessage);
    }

    private async saveBotMessage(sessionId: string, message: string) {
        const chatMessage: ChatMessage = {
            sender: 'bot',
            message: message,
            id: uuidv4(),
            sessionId: sessionId
        };
        this.emit('messageAdded', chatMessage);
    }

    private async addQuestionCard(sessionId: string, text: string) {
        console.log(text)
        const res = await this.getCard({
            sessionId: sessionId,
            text: text
        });

        if (res?.status !== 204 && res?.data) {
            const card: ResponseCard = {
                sender: res.data.sender,
                header: res.data.header,
                expanded: res.data.expanded,
                data: res.data.data,
                tags: res.data.tags,
                codeExample: res.data.codeExample,
                summary: res.data.summary,
                error: res.data.error,
                sessionId: sessionId,
                id: uuidv4()
            };
            this.emit('cardAdded', card);
        }
    }

    async getCard(cardData: { sessionId: string; text: string }) {
        console.log(cardData)
        try {
            const response = await fetch('http://localhost:8080/api/chat/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cardData)
            });

            if (response.status === 204) {
                return { status: 204, data: null };
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return { status: response.status, data };
        } catch (error) {
            console.error('Error saving card to database:', error);
            return null;
        }
    }

    saveResumptionTokenToDatabase(hanleData: { sessionId: string; resumptionToken: string }) {
        try {
            fetch('http://localhost:8080/api/settings/resumption-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(hanleData)
            });
        } catch (error) {
            console.error('Error saving card to database:', error);
            return null;
        }
    }

    private async updateSystemInstructionForGemini(newQuestion: Question | null) {
        let systemPrompt: string;

        if (newQuestion) {
            systemPrompt = `Ты — опытный технический интервьюер.

            ДОСТУПНЫЕ ИНСТРУМЕНТЫ:
            - evaluate_answer: Оценивай каждый ответ кандидата
            - advance_interview: Переходи к следующему вопросу/фазе
            - ask_question: Задавай вопросы кандидату
            - provide_feedback: Давай обратную связь

            АЛГОРИТМ РАБОТЫ:
            1. Получил ответ → вызови evaluate_answer
            2. Если нужны уточнения → provide_feedback с типом "clarification"
            3. Если ответ полный → advance_interview для следующего вопроса
            4. Новый вопрос → ask_question

            ТЕКУЩИЕ ДАННЫЕ:
            - Позиция: ${this.interviewBot.position}
            - Текущая фаза: ${this.interviewBot.current_phase}
            - Текущий вопрос: ${newQuestion.text}
            - Ключевые слова: ${newQuestion.expectedKeywords.join(', ')}
            - Критерии оценки: ${newQuestion.evaluationCriteria.join(', ')}

            ВАЖНО:
            - Всегда используй инструменты для управления интервью
            - Не задавай вопросы напрямую в тексте, используй ask_question
            - Оценивай каждый ответ через evaluate_answer
            - Будь дружелюбным и профессиональным

            Начни с использования ask_question для текущего вопроса.`;
        } else {
            systemPrompt = `Интервью завершено. Используй provide_feedback с типом "final_feedback"
                          для финального фидбека кандидату.`;
        }

        this.send({
            text: `[SYSTEM_UPDATE] ${systemPrompt}`
        }, true);

        console.log("Updated system instruction with tools sent to Gemini.");
    }

    private async finalizeInterview() {
        console.log("Finalizing interview...");

        const finalReport = this.interviewBot.generate_final_report();
        console.log("Final Interview Report:", finalReport);

        setTimeout(() => {
            this.disconnect();
        }, 10000);
    }

    private async handleAdvanceThemedConversation(args: any): Promise<any> {
        this.conversationBot.advance_to_next_question();
        const curr_goal = this.conversationBot.get_current_goal()
        if (curr_goal) {
            await this.updateSystemInstructionForThemedConversation(curr_goal);
            const userSettings = await getCurrentUserSettingsAsync();
            console.log(curr_goal);
            this.addQuestionCard(userSettings.activeSessionId, curr_goal);
            return { status: "success", curr_goal };
        }
    }

    private async handleEvaluateThemedAnswer(args: any): Promise<any> {
        const evaluation = {
            score: args.score,
            relevance: args.relevance,
            depth: args.depth,
            nextAction: args.nextAction,
        };
        //this.conversationBot.saveEvaluation(evaluation);
        return { status: "success", evaluation };
    }

    private async handleAskChallengingQuestion(args: any): Promise<any> {
        const question = args.question;
        this.send({ text: question }, true);
        return { status: "success", questionAsked: question };
    }

    private async updateSystemInstructionForThemedConversation(currentGoal: string) {
        const systemPrompt = `Ты - эксперт по тематическим беседам. Текущая тема: ${currentGoal}.
          Используй инструменты: evaluateThemedAnswer, advanceThemedConversation, askChallengingQuestion.`;

        this.send({ text: `[SYSTEM_UPDATE] ${systemPrompt}` }, true);
        console.log("Updated system instruction for themed conversation.");
    }
}

