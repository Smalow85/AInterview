/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function App() {
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
