import { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import Logger from "../logger/Logger";
import "./side-panel.scss";
import { useLoggerStore } from "../../lib/store-logger";
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from "../../lib/store-settings";
import { getCurrentUserSettingsAsync } from "../../lib/store-settings";
import InterviewQuestionGenerator from "../conversations/InterviewQuestionGenerator";
import SimpleConversationGenerator from "../conversations/SimpleConverationGenerator";
import ThemedConversationGenerator from "../conversations/ThemedConversationGenerator";
import Modal from "../main-panel/Modal";

export default function SidePanel() {
  const { client } = useLiveAPIContext();
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { messages, addMessage, clearMessages } = useLoggerStore();
  const { settings } = useSettingsStore();

  const [showInterviewGenerator, setShowInterviewGenerator] = useState(false);
  const [showThemedConsultationGenerator, setShowThemedConsultationGenerator] = useState(false);
  const [showSimpleConversation, setShowSimpleConversation] = useState(false);
  const [showConversationTypeDialog, setShowConversationTypeDialog] = useState(false);
  const [selectedConversationType, setSelectedConversationType] = useState<string | null>(null);

  const conversationTypes = [
    { value: 'interview', label: 'Real Interview' },
    { value: 'simple', label: 'Simple Conversation' },
    { value: 'themed', label: 'Consultation on selected theme' },
  ];

  const handleStartConversation = () => {
    setShowConversationTypeDialog(true);
  };

  const handleConversationTypeSelected = (type: string) => {
    setSelectedConversationType(type);
    setShowConversationTypeDialog(false);

    if (type === 'interview') {
      setShowInterviewGenerator(true);
    } else if (type === 'simple') {
      setShowSimpleConversation(true);
    } else if (type === 'themed') {
      setShowThemedConsultationGenerator(true);
    }
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
          <button className="clear-button" onClick={handleStartConversation}>
            Start Conversation
          </button>

          <Modal isOpen={showConversationTypeDialog} onClose={() => setShowConversationTypeDialog(false)}>
            <h2>Select conversation type:</h2>
            <div className="conversation-type-dialog">
              <select
                value={selectedConversationType || ''}
                onChange={(e) => handleConversationTypeSelected(e.target.value)}
              >
                <option value="" disabled>
                   Select a type...
                </option>
                {conversationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </Modal>
          <Modal isOpen={showThemedConsultationGenerator} onClose={() => setShowThemedConsultationGenerator(false) }>
            <ThemedConversationGenerator onClose={() => setShowThemedConsultationGenerator(false) }/>
          </Modal>
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