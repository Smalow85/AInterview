import { useEffect, useState, useCallback } from "react";

export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  message: string;
  createdAt?: number
};

export type Message = {
  sender: "user" | "bot";
  message: string;
};

const useChatStore = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/chat/history");
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error("Error fetching messages:", e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMessage = async (msg: Omit<ChatMessage, "id" | "createdAt">) => {
    const messageData = {
                            sessionId: '123',
                            sender: msg.sender,
                            message: msg.message,
                        };
    const res = await fetch('http://localhost:8080/api/chat/save', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    });
    const saved = await res.json();
    console.log("Saved message:", saved)
    console.log("State:", messages)
    setMessages((prev) => [...prev, saved]);
    console.log("State:", messages)
  };

  const clearMessages = async () => {
    await fetch("/api/chat/messages", { method: "DELETE" });
    setMessages([]);
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    console.log(messages)
  }, [messages]);

  return { messages, addMessage, clearMessages, loading, fetchMessages };
};

export default useChatStore;
