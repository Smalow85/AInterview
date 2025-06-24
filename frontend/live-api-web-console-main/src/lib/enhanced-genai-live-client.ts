import { GenAILiveClient } from "./genai-live-client";
import { LiveClientOptions } from "../types";
import { ChatMessage } from "../types/chat-message";
import { ResponseCard } from "../types/response-card";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUserSettingsAsync } from "./store-settings";
import { TechnicalInterviewBot, Question, AnalysisResult } from "../types/interview-types";

export class EnhancedGenAILiveClient extends GenAILiveClient {
    private accumulatedText: string = "";
    private accumulatedInputText: string = "";
    public interviewBot: TechnicalInterviewBot;

    constructor(options: LiveClientOptions) {
        super(options);
        this.interviewBot = new TechnicalInterviewBot();
        this.onmessage = this.onmessage.bind(this);
        this.handleTurnComplete = this.handleTurnComplete.bind(this);
        this.sendRealtimeInput = this.sendRealtimeInput.bind(this);
    }

    protected async onmessage(message: any) {
        await super.onmessage(message);
        if (message.serverContent) {
            if ("inputTranscription" in message.serverContent) {
                this.accumulatedInputText += message.serverContent.inputTranscription.text;
            }
            if ("outputTranscription" in message.serverContent) {
                this.accumulatedText += message.serverContent.outputTranscription.text;
            }
            if ("turnComplete" in message.serverContent && message.serverContent.turnComplete) {
                this.handleTurnComplete();
            }
        }
    }

    private async handleTurnComplete() {
        const userSettings = await getCurrentUserSettingsAsync();
        if (this.accumulatedInputText) {
            await this.saveMessageToDatabase({ sessionId: userSettings.activeSessionId, sender: 'user', message: this.accumulatedInputText });
            const message: ChatMessage = {
                sender: 'user',
                message: this.accumulatedInputText,
                id: uuidv4()
        }
            this.emit('messageAdded', message);
            const analysisResult = this.interviewBot.process_answer(this.accumulatedInputText);
            if (analysisResult.status === 'interview_complete') {
                await this.finalizeInterview();
                return;
            }
            await this.sendAnalysisToGemini(analysisResult);
            this.accumulatedInputText = '';
        } else {
            console.warn("No input text to save for this turn.");
        }
        if (this.accumulatedText) {
            await this.saveMessageToDatabase({ sessionId: userSettings.activeSessionId, sender: 'bot', message: this.accumulatedText });
            const message: ChatMessage = {
                sender: 'bot',
                message: this.accumulatedText,
                id: uuidv4()
            }
            this.emit('messageAdded', message);
                const res = await this.saveCardToDatabase({ sessionId: userSettings.activeSessionId, sender: 'bot', message: this.accumulatedText });
                if (res?.status != 204) {
                    console.log(res)
                const data: ResponseCard = res?.data;
                if (data) {
                    const card: ResponseCard = {
                        sender: data.sender,
                        header: data.header,
                        expanded: data.expanded,
                        data: data.data,
                        tags: data.tags,
                        codeExample: data.codeExample,
                        summary: data.summary,
                        error: data.error,
                        id: uuidv4()
                    }
                    console.log('Card', card)
                    this.emit('cardAdded', card);
                }
            }
            this.accumulatedText = '';
        } else {
            console.warn("No output text to save for this turn.");
        }
        this.emit("turncomplete");
    }

    async saveMessageToDatabase(messageData: { sessionId: string; sender: string; message: string }) {
        try {
            const response = await fetch('http://localhost:8080/api/chat/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error saving message to database:', error);
        }
    }

    async saveCardToDatabase(cardData: { sessionId: string; sender: string; message: string }) {
        try {
            const response = await fetch('http://localhost:8080/api/chat/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cardData)
            });
            console.log(response)

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
            console.error('Error saving message to database:', error);
        }
    }

    private async handleToolCallFromGemini(toolCall: any) {
        console.log("Received tool call from Gemini:", toolCall);
        const functionName = toolCall.functionCall.name;
        const args = toolCall.functionCall.args || {};

        let functionResponse: any = { name: functionName, response: { status: "success" } };

        if (functionName === "evaluate_answer") {
            // Save evaluation from Gemini's tool call
            this.saveEvaluation(args);
        } else if (functionName === "advance_interview") {
            const action = args.action;
            if (action === "next_question") {
                this.interviewBot.advance_to_next_question();
                // Optionally, update system instruction if a new question is ready
                const newQuestion = this.interviewBot.get_current_question();
                if (newQuestion) {
                    await this.updateSystemInstructionForGemini(newQuestion);
                }
            } else if (action === "next_phase") {
                this.interviewBot.advance_to_next_question(); // This will increment phase if question index resets
                await this.updateSystemInstructionForGemini(this.interviewBot.get_current_question());
            } else if (action === "complete") {
                await this.finalizeInterview();
            }
        } else if (functionName === "summarize" || functionName === "get_context") {
            // Placeholder for actual tool execution. Gemini expects a response.
            // For a real scenario, you'd call a backend service or perform the action.
            console.warn(`Tool function '${functionName}' called but not fully implemented for execution.`);
            // You might need to send a more meaningful response based on the tool's actual output
        } else {
            console.warn(`Unknown function call: ${functionName}`);
            functionResponse = { name: functionName, response: { status: "failed", error: "Unknown function" } };
        }

        // Send tool response back to Gemini
        this.sendToolResponse({ functionResponses: [functionResponse] });
    }

    private saveEvaluation(evaluation: { score?: number; keywords_found?: string[]; needs_followup?: boolean; next_action?: string }) {
        if (this.interviewBot.answers.length > 0) {
            const lastAnswer = this.interviewBot.answers[this.interviewBot.answers.length - 1];
            lastAnswer.evaluation_score = evaluation.score || 0;
            lastAnswer.notes = JSON.stringify(evaluation);
            console.log("Evaluation saved:", lastAnswer);
        }
    }

    private async sendAnalysisToGemini(analysisResult: AnalysisResult) {
        const currentQuestion = this.interviewBot.get_current_question();
        const promptText = `Анализ ответа кандидата:
- Найденные ключевые слова: ${analysisResult.analysis.found_keywords.join(', ')}
- Полнота ответа: ${analysisResult.analysis.completeness_score.toFixed(2)}
- Нужны уточнения: ${analysisResult.analysis.needs_follow_up ? 'Да' : 'Нет'}
${analysisResult.analysis.suggested_follow_ups.length > 0
            ? analysisResult.analysis.suggested_follow_ups[0]
            : (currentQuestion ? `Переходи к следующему вопросу: ${currentQuestion.text}` : 'Интервью завершается.')}`;

        console.log("Sending analysis to Gemini:", promptText);
        // Send as a user turn (or client content) so Gemini can react
        await this.send({ text: promptText }, true);
    }

    private async updateSystemInstructionForGemini(newQuestion: Question | null) {
        let systemPrompt: string;
        if (newQuestion) {
            systemPrompt = `Ты ведешь техническое собеседование на позицию ${this.interviewBot.position}.
ПРАВИЛА ПРОВЕДЕНИЯ:
1. Говори четко и профессионально, но дружелюбно
2. Задавай вопросы по очереди, не спеши
3. Внимательно слушай ответы и анализируй их
4. Задавай уточняющие вопросы если ответ неполный
5. Поощряй кандидата, если он думает в правильном направлении
6. Давай подсказки если кандидат застрял
ТЕКУЩИЙ ВОПРОС: ${newQuestion.text}
КРИТЕРИИ ОЦЕНКИ: ${newQuestion.evaluationCriteria.join(', ')}
КЛЮЧЕВЫЕ СЛОВА: ${newQuestion.expectedKeywords.join(', ')}
СТРУКТУРА ИНТЕРВЬЮ:
${this.interviewBot.phases.map(p => `- ${p.name} (${p.duration_minutes} мин)`).join('\n')}
Текущая фаза: ${this.interviewBot.current_phase}
Теперь задай следующий вопрос.`;
        } else {
            systemPrompt = `Интервью завершено. Поблагодари кандидата за время, дай краткий позитивный фидбек и объясни следующие шаги процесса найма.
Будь профессиональным и вдохновляющим.`;
        }

        // To update system instruction, you need to send it as part of a new `LiveConnectConfig`
        // or as a client content message that guides the model. The `@google/genai` library's
        // `session.updateConfig` is typically used for this, but it's not directly exposed here.
        // A common pattern is to send a "hint" or "instruction" as a user message to guide the model.
        // For a full system instruction update, the connection might need to be re-established
        // with a new config, or the model needs to be instructed via function calls or user messages.

        // For now, we'll send it as a user message to guide the model.
        await this.send({ text: `[SYSTEM_UPDATE] New context for the interview: ${systemPrompt}` }, true);
        console.log("Updated system instruction sent to Gemini.");
    }

    private async finalizeInterview() {
        console.log("Finalizing interview...");
        const finalReport = this.interviewBot.generate_final_report();
        console.log("Final Interview Report:", finalReport);

        // Optionally save the final report to the database
        const userSettings = await getCurrentUserSettingsAsync();
        if (userSettings.activeSessionId) {
            // Assuming you have an API endpoint to save the final report
            // await fetch('http://localhost:8080/api/interview/report/save', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ sessionId: userSettings.activeSessionId, report: finalReport })
            // });
        }

        // Send a final message to Gemini to conclude the interview
        await this.send({ text: `Интервью завершено. Пожалуйста, поблагодари кандидата и предоставь краткий фидбек.` }, true);

        this.disconnect(); // Disconnect after completion
    }

}
