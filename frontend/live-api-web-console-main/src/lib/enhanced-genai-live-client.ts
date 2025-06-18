import { GenAILiveClient } from "./genai-live-client";
import { LiveClientOptions } from "../types";
import { ChatMessage } from "../types/chat-message";
import { ResponseCard } from "../types/response-card";
import { v4 as uuidv4 } from 'uuid'; // Import from uuid library

export class EnhancedGenAILiveClient extends GenAILiveClient {
    private accumulatedText: string = "";
    private accumulatedInputText: string = "";

    constructor(options: LiveClientOptions) {
        super(options);
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
        const storedSessionId = localStorage.getItem('sessionId');
        if (this.accumulatedInputText) {
            await this.saveMessageToDatabase({ sessionId: storedSessionId || '-1', sender: 'user', message: this.accumulatedInputText });
            const message: ChatMessage = {
                sender: 'user',
                message: this.accumulatedInputText,
                id: uuidv4()
        }
            this.emit('messageAdded', message);
        } else {
            console.warn("No input text to save for this turn.");
        }
        if (this.accumulatedText) {
            await this.saveMessageToDatabase({ sessionId: storedSessionId || '-1', sender: 'bot', message: this.accumulatedText });
            const message: ChatMessage = {
                sender: 'bot',
                message: this.accumulatedText,
                id: uuidv4()
            }
            this.emit('messageAdded', message);
                const res = await this.saveCardToDatabase({ sessionId: storedSessionId || '-1', sender: 'bot', message: this.accumulatedText });
                if (res?.status != 204) {
                const data: ResponseCard = res?.data;
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

}
