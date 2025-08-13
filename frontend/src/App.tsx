import { useEffect, useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { LiveClientOptions } from "./types";
import MainPanel from "./components/main-panel/MainPanel";
import DocumentPanel from "./components/right-panel/RightPanel";
import { useSettingsStore } from "./lib/store-settings";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function App() {
  const { currentUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const { settings } = useSettingsStore();

  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const toggleSidePanel = () => {
    setIsSidePanelCollapsed(!isSidePanelCollapsed);
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  useEffect(() => {
    document.body.className = settings.theme || "dark";
  }, [settings.theme]);

  // Если пользователя нет, показываем страницу входа/регистрации
  if (!currentUser) {
    return isLogin ? (
      <Login onSwitchToRegister={() => setIsLogin(false)} />
    ) : (
      <Register onSwitchToLogin={() => setIsLogin(true)} />
    );
  }

  // Если пользователь есть, показываем основное приложение
  return (
      <LiveAPIProvider options={apiOptions}>
        <div className="App">
          <div className="streaming-console">
            <SidePanel isCollapsed={isSidePanelCollapsed} onToggleCollapse={toggleSidePanel} />
            <main>
              <div className="main-app-area">
                <div className="main-app-area-main-panel">
                  <MainPanel />
                </div>
                <video
                  className={cn("stream", {
                    hidden: !videoRef.current || !videoStream,
                  })}
                  ref={videoRef}
                  autoPlay
                  playsInline
                />
              </div>
              <div className="control-tray-container">
                <ControlTray
                  videoRef={videoRef}
                  supportsVideo={true}
                  onVideoStreamChange={setVideoStream}
                  enableEditingSettings={true}
                >
                </ControlTray>
              </div>  
            </main>
            <DocumentPanel isCollapsed={isRightPanelCollapsed} onToggleCollapse={toggleRightPanel} />
          </div>
        </div>
      </LiveAPIProvider>
  );
}

export default App;