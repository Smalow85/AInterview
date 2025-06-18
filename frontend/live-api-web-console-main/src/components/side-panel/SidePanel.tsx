import { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import Logger from "../logger/Logger";
import "./side-panel.scss";
import { useLoggerStore } from "../../lib/store-logger";
import { v4 as uuidv4 } from 'uuid';

export default function SidePanel() {
  const { client } = useLiveAPIContext();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { messages, addMessage, clearMessages } = useLoggerStore();

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  }, [sessionId]);

  const handleStartConversation = async () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    console.log("Conversation started with session ID:", newSessionId);
  };

  const handleEndConversation = async () => {
    if (sessionId) {
      try {
        const response = await fetch(`/analyze?sessionId=${sessionId}`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Analysis results:", data);
      } catch (error) {
        console.error("Error analyzing conversation:", error);
      }
      setSessionId(null);
    } else {
      console.log("No active conversation to end.");
    }
  };

  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    client.on("messageAdded", addMessage);
    return () => {
      client.off("messageAdded", addMessage);
    };
  }, [client, addMessage]);

  const handleClearMessages = () => {
    console.log("Clear chat history")
    clearMessages();
  };

  return (
    <div className={"side-panel"}>
      <div className="side-panel-top">
        <div className="side-panel-title">Chat history</div>
      </div>
      <div className="side-panel-container" ref={loggerRef}>
        <Logger />
      </div>
      <div className="input-container">
        {messages.length > 0 ? (
          <>
        <button className="clear-button" onClick={handleClearMessages}>
          Clear Messages
        </button>
            {sessionId && (
          <button className="end-conversation-button" onClick={handleEndConversation}>
            End Conversation
          </button>
            )}
          </>
        ) : (
          <button className="start-conversation-button" onClick={handleStartConversation}>
            Start Conversation
          </button>
        )}
      </div>
    </div>
  );
}
