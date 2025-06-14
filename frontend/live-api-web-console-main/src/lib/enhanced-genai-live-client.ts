import { GenAILiveClient } from "./genai-live-client";
import { LiveClientOptions } from "../types";
import { ChatMessage } from "./store-chat";
import { v4 as uuidv4 } from 'uuid'; // Import from uuid library

export class EnhancedGenAILiveClient extends GenAILiveClient {
    private accumulatedText: string = "";

    constructor(options: LiveClientOptions) {
        super(options);
        this.onmessage = this.onmessage.bind(this);
        this.handleUserInput = this.handleUserInput.bind(this);
        this.handleTurnComplete = this.handleTurnComplete.bind(this);
        this.sendRealtimeInput = this.sendRealtimeInput.bind(this);
    }

    protected async onmessage(message: any) {
        await super.onmessage(message);
        if (message.serverContent) {
            if ("inputTranscription" in message.serverContent) {
                this.handleUserInput(message.serverContent.inputTranscription.text);
            }
            if ("outputTranscription" in message.serverContent) {
                this.accumulatedText += message.serverContent.outputTranscription.text;
            }
            if ("turnComplete" in message.serverContent && message.serverContent.turnComplete) {
                this.handleTurnComplete();
            }
        }
    }

    private async handleUserInput(text: string) {
        await this.saveMessageToDatabase({ sessionId: '123', sender: 'user', message: text });
        const message: ChatMessage = {
            sender: 'user',
            message: text,
            id: uuidv4()
        }
        this.emit('messageAdded', message);
    }

    private async handleTurnComplete() {
        if (this.accumulatedText) {
            await this.saveMessageToDatabase({ sessionId: '123', sender: 'bot', message: this.accumulatedText });
            const message: ChatMessage = {
                sender: 'bot',
                message: this.accumulatedText,
                id: uuidv4()
            }
            this.emit('messageAdded', message);
            this.accumulatedText = '';
                } else {
            console.warn("No text to save for this turn.");
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

}
