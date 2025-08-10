import { useRef, useState, useEffect } from "react";
import cn from "classnames";
import "./right-panel.scss";
import { useCardStore } from "../../lib/store-card";
import CardModal from "../main-panel/CardModal";

interface RightPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function RightPanel({ isCollapsed, onToggleCollapse }: RightPanelProps) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const docListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { favoriteCards, removeFromFavoriteCards } = useCardStore();
  const [showModal, setShowModal] = useState<string | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDocs = [...documents, file];
      setDocuments(newDocs);
      setSelectedDoc(file);
      localStorage.setItem("documents", JSON.stringify(newDocs.map((f) => f.name)));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFromFavorite = async (e: React.MouseEvent, cardId: string, favorite: number) => {
    e.stopPropagation();
    await removeFromFavoriteCards(cardId, favorite);
    useCardStore.getState().fetchFavoriteCards();
  };

  const handleDocSelect = (doc: File) => {
    setSelectedDoc(doc);
  };

  const handleCardClose = () => {
    setShowModal(null);
  };

  const handleCardClick = (cardId: string) => {
    setShowModal(cardId);
  };

  const sendDocToServer = async () => {
    setServerMessage(null);
    if (selectedDoc) {
      try {
        const formData = new FormData();
        formData.append("file", selectedDoc);

        const response = await fetch("http://localhost:8000/upload-file", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error! status: ${response.status}, ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        setServerMessage(data.message || "File uploaded successfully!");
      } catch (error) {
        setServerMessage(`Error: ${error}`);
      }
    } else {
      setServerMessage("No document selected.");
    }
  };

  useEffect(() => {
    useCardStore.getState().fetchFavoriteCards();
  }, []);

  return (
    <div className={`right-panel ${isCollapsed ? "collapsed" : ""}`}>
      <div className="right-panel-top">
        <div className="right-panel-title">Saved Cards</div>
        <button
          className={cn("collapse-btn", { collapsed: isCollapsed })}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? ">>" : ">>"}
        </button>
      </div>

      <div
        className="right-panel-content"
        aria-hidden={isCollapsed}
        style={{ pointerEvents: isCollapsed ? "none" : undefined }}
      >
        <div className="saved-cards-container">
          <div className="saved-cards-list">
            {favoriteCards.map((card) => (
              <div
                key={card.id}
                className="saved-card"
                onClick={() => handleCardClick(card.id)}
                style={{ cursor: "pointer" }}
              >
                <h4>{card.header}</h4>
                <p>{card.summary}</p>
                <button
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFavorite(e, card.id, 0);
                  }}
                  aria-label="Delete card"
                  title="Delete card"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Контейнер с документами — раскрывается, если документы есть */}
        <div
          className={cn("document-panel-container", {
            expanded: documents.length > 0,
            collapsed: documents.length === 0,
          })}
          ref={docListRef}
        >
          {/* Список документов */}
          {documents.length > 0 && (
            <div className="document-panel-list">
              <ul>
                {documents.map((doc) => (
                  <li key={doc.name} onClick={() => handleDocSelect(doc)}>
                    {doc.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Выбранный документ и кнопка отправки */}
          {selectedDoc && (
            <div className="selected-document">
              <p>Selected: {selectedDoc.name}</p>
              <button
                className="upload-button"
                onClick={sendDocToServer}
                tabIndex={isCollapsed ? -1 : 0}
              >
                Send to Server
              </button>
              {serverMessage && <p>{serverMessage}</p>}
            </div>
          )}
        </div>

        {/* Кнопка загрузки всегда внизу */}
        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            tabIndex={isCollapsed ? -1 : 0}
          >
            Load Docs
          </button>
        </div>

        {showModal && (
          <CardModal
            onClose={handleCardClose}
            card={favoriteCards.find((card) => card.id === showModal) || null}
          />
        )}
      </div>
    </div>
  );
}