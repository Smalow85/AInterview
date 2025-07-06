import { useRef, useState } from "react";
import "./document-panel.scss";

export default function DocumentPanel() {
  const [documents, setDocuments] = useState<File[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const docListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDoc(file);
      setDocuments([...documents, file]);
      localStorage.setItem('documents', JSON.stringify(documents.map(file => file.name)));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    }
  };

  const handleDocSelect = (doc: File) => {
    setSelectedDoc(doc);
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

  return (
    <div className={"document-panel"}>
      <div className="document-panel-top">
        <div className="document-panel-title">Documents</div>
      </div>
      <div className="document-panel-container" ref={docListRef}>
        <div className="input-container">
          <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: "none" }} />
          <button className="upload-button" onClick={() => fileInputRef.current?.click()}>Load Docs</button>
        </div>
        <div className="document-panel-list">
          <ul>
            {documents.map((doc) => (
              <li key={doc.name} onClick={() => handleDocSelect(doc)}>
                {doc.name}
              </li>
            ))}
          </ul>
        </div>
        {selectedDoc && (
          <div className="selected-document">
            <p>Selected: {selectedDoc.name}</p>
            <button className="upload-button" onClick={sendDocToServer}>
              Send to Server
            </button>
            {serverMessage && <p>{serverMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
