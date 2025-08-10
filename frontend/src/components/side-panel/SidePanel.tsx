import { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import Logger from "../logger/ChatHistory";
import "./side-panel.scss";
import cn from "classnames";
import { useLoggerStore } from "../../lib/store-logger";
import { useSettingsStore } from "../../lib/store-settings";
import InterviewQuestionGenerator from "../conversations/InterviewQuestionGenerator";
import SimpleConversationGenerator from "../conversations/SimpleConverationGenerator";
import ThemedConversationGenerator from "../conversations/ThemedConversationGenerator";
import Modal from "../main-panel/Modal";

interface SidePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SidePanel({ isCollapsed, onToggleCollapse }: SidePanelProps) {
  const { client } = useLiveAPIContext();
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { messages, addMessage, clearMessages } = useLoggerStore();
  const { settings, updateSettings } = useSettingsStore();

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
    updateSettings({ sessionActive: true, sessionType: 'default', activeSessionId: undefined });
    clearMessages();
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
    console.log("Clear chat history");
    clearMessages();
  };

  return (
    <div className={`side-panel ${isCollapsed ? "collapsed" : ""}`}>
      <div className="side-panel-top">
        {!isCollapsed && <div className="side-panel-title">Chat history</div>}
        <button
          className={cn("collapse-btn", { collapsed: isCollapsed })}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? "<<" : "<<"}
        </button>
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

            {/* Модальные окна */}
            <Modal isOpen={showConversationTypeDialog} onClose={() => setShowConversationTypeDialog(false)}>
              <h2>Select conversation type:</h2>
              <div className="conversation-type-dialog">
                <select
                  value={selectedConversationType || ""}
                  onChange={(e) => handleConversationTypeSelected(e.target.value)}
                  className="card-style-select"
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

            <Modal isOpen={showThemedConsultationGenerator} onClose={() => setShowThemedConsultationGenerator(false)}>
              <ThemedConversationGenerator onClose={() => setShowThemedConsultationGenerator(false)} />
            </Modal>

            <Modal isOpen={showInterviewGenerator} onClose={() => setShowInterviewGenerator(false)}>
              <InterviewQuestionGenerator onClose={() => setShowInterviewGenerator(false)} />
            </Modal>

            <Modal isOpen={showSimpleConversation} onClose={() => setShowSimpleConversation(false)}>
              <SimpleConversationGenerator onClose={() => setShowSimpleConversation(false)} />
            </Modal>
          </>
        )}
      </div>
    </div>
  );
}