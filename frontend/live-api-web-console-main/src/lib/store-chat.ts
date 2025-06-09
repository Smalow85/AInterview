import { useEffect, useState, useCallback } from "react";

export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  message: string;
  createdAt?: number;
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "welcome1",
    sender: "bot",
    message: "Привет! Я ваш AI-помощник. Задайте мне любой вопрос.",
    createdAt: Date.now(),
  },
  {
    id: "welcome2",
    sender: "user",
    message: "Расскажи, что ты умеешь?",
    createdAt: Date.now() + 1,
  },
];

const BASE_URL = process.env.SPRING_BOOT_APP_API_BASE_URL as string;

export function useChatStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка истории с бэка
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/chat/history");
      const data = await res.json();
      console.log("Fetched messages:", data);
      if (Array.isArray(data) && data.length === 0) {
        setMessages(DEFAULT_MESSAGES);
      } else {
        setMessages(data);
      }
    } catch (e) {
      setMessages(DEFAULT_MESSAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Добавление сообщения и сохранение на бэк
  const addMessage = async (msg: Omit<ChatMessage, "id" | "createdAt">) => {
    const res = await fetch(`${BASE_URL}/api/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    const saved = await res.json();
    setMessages((prev) => [...prev, saved]);
  };

  // Очистка истории на бэке
  const clearMessages = async () => {
    await fetch("/api/chat/messages", { method: "DELETE" });
    setMessages([]);
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, addMessage, clearMessages, loading, fetchMessages };
}