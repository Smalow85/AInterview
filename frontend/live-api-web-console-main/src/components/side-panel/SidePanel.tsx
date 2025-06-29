import { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import Logger from "../logger/Logger";
import "./side-panel.scss";
import { useLoggerStore } from "../../lib/store-logger";
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from "../../lib/store-settings";
import { getCurrentUserSettingsAsync } from "../../lib/store-settings";
import InterviewQuestionGenerator from "../interview-question-generator/InterviewQuestionGenerator";
import SimpleConversationGenerator from "../simple-conversation-generator/SimpleConverationGenerator";
import Modal from "../main-panel/Modal";

export default function SidePanel() {
  const { client } = useLiveAPIContext();
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { messages, addMessage, clearMessages } = useLoggerStore();
  const { settings, persistUpdates, updateSessionType } = useSettingsStore();

  const [showInterviewGenerator, setShowInterviewGenerator] = useState(false);
  const [showSimpleConversation, setShowSimpleConversation] = useState(false);
  
  const handleStartInterview = async () => {
    const newSessionId = uuidv4();
    persistUpdates({
      ...settings,
      activeSessionId: newSessionId
    });
    updateSessionType('interview')
    console.log("Interview started with session ID:", newSessionId);
    
    setShowInterviewGenerator(true);
  };
  const handleStartSimpleConversation = async () => {
    const newSessionId = uuidv4();
    console.log("Persist")
    persistUpdates({
      ...settings,
      activeSessionId: newSessionId,
    });
    updateSessionType('default')
    console.log("Conversation started with session ID:", newSessionId);

    setShowSimpleConversation(true);
  };

  const handleEndConversation = async () => {
    const user = await getCurrentUserSettingsAsync()
    if (user.activeSessionId) {
      try {
        const response = await fetch(`/analyze?sessionId=${user.activeSessionId}`, {
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
            {settings.activeSessionId && (
          <button className="end-conversation-button" onClick={handleEndConversation}>
            End Conversation
          </button>
            )}
          </>
        ) : (
          <>
          <button className="clear-button" onClick={handleStartInterview}>
            Start Interview
          </button>
          <button className="clear-button" onClick={handleStartSimpleConversation}>
            Start Simple Conversation
          </button>
          <Modal isOpen={showInterviewGenerator} onClose={() => setShowInterviewGenerator(false) }>
            <InterviewQuestionGenerator onClose={() => setShowInterviewGenerator(false) }/>
          </Modal>

          <Modal isOpen={showSimpleConversation} onClose={() => setShowSimpleConversation(false) }>
            <SimpleConversationGenerator onClose={() => setShowSimpleConversation(false) }/>
          </Modal>
          </>
        )}
      </div>
    </div>
  );
}
