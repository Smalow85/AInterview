export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'bot';
  message: string;
}