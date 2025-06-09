import { GenAILiveClient } from "./genai-live-client";
import { LiveClientOptions } from "../types";
// other imports ...

export class EnhancedGenAILiveClient extends GenAILiveClient {
    constructor(options: LiveClientOptions) {
        super(options);
        this.onmessage = this.onmessage.bind(this); //Bind this method for correct context
    }
    async onmessage(message: any) {
        console.log("Received message:", message);
        await super.onmessage(message);

        //Add your custom logic for saving messages to the database
        if (message.serverContent && message.serverContent.modelTurn) {
            const userMessage = message.serverContent.clientTurn?.parts[0]?.text;
            const botMessage = message.serverContent.modelTurn?.parts[0]?.text;
            console.log("User message:", userMessage);
            console.log("Bot message:", botMessage);
            if (userMessage){
                await this.saveMessageToDatabase({ sessionId: '123', sender: 'user', message: userMessage });
            }
            if (botMessage){
                await this.saveMessageToDatabase({ sessionId: '123', sender: 'bot', message: botMessage });
            }
        }
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving message to database:', error);
        }
    }
}