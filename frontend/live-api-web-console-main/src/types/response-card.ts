export interface ResponseCard {
  id: string;
  sender: 'user' | 'bot';
  header?: string;
  expanded?: boolean;
  data: string;
  tags?: string[];
  codeExample?: string;
  summary?: string;
  error?: string;
}