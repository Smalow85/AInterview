export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
}