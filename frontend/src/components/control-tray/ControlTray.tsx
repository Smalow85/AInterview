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

import cn from "classnames";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import "./control-tray.scss";
import SettingsDialog from "../settings-dialog/SettingsDialog";
import { useSettingsStore } from "../../lib/store-settings";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button className="action-button" onClick={stop}>
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button className="action-button" onClick={start}>
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    )
);

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => { },
  supportsVideo,
  enableEditingSettings,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);
  const { client, connected, connect, disconnect, config, setConfig } = useLiveAPIContext();
  const [isResuming, setIsResuming] = useState(false);
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const handleConversation = async () => {
    console.log("refresh", config);
    setIsResuming(true);
    try {
      const actualSettings = await fetchSettings();
      const newConfig = {
        ...config,
        sessionResumption: { handle: actualSettings?.resumptionToken }
      };

      setConfig(newConfig); // обновляем состояние
      updateSettings({ resumptionToken: undefined });
      await connect(newConfig);
      setIsResuming(false);
    } catch (error) {
      console.error("Error resuming conversation:", error);
      setIsResuming(false);
    }
  };

  const handleStartNewConversation = async () => {
    console.log("new", config);
    updateSettings({ resumptionToken: undefined })
    setConfig({ ...config, sessionResumption: undefined });
    try {
      await connect(config);
    } catch (error) {
      console.error("Error starting new conversation:", error);
    }
  };

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    if (!isResuming && refreshButtonRef.current) {
      refreshButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      try {
        client
          .sendRealtimeInput([
            {
              mimeType: "audio/pcm;rate=16000",
              data: base64,
            },
          ])
      } catch (error) {
        console.error("Error sending realtime input:", error);
      };
    };

    if (connected && !muted && audioRecorder) {
      console.log("starting audio recorder");
      try {
        audioRecorder
          .on("data", onData)
          .on("volume", setInVolume)
          .start()
      } catch (error) {
        console.error("Error starting audio recorder:", error);
      };
    } else {
      console.log("Stopping audio recorder");
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  return (
    <section className="control-tray">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <nav className={cn("actions-nav", { disabled: !connected })}>
        <button
          className={cn("action-button mic-button")}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>

        <div className="action-button no-action outlined">
          <AudioPulse volume={inVolume} active={connected} hover={false} />
        </div>

        {supportsVideo && (
          <>
            <MediaStreamButton
              isStreaming={screenCapture.isStreaming}
              start={changeStreams(screenCapture)}
              stop={changeStreams()}
              onIcon="cancel_presentation"
              offIcon="present_to_all"
            />
            <MediaStreamButton
              isStreaming={webcam.isStreaming}
              start={changeStreams(webcam)}
              stop={changeStreams()}
              onIcon="videocam_off"
              offIcon="videocam"
            />
          </>
        )}
        {children}
      </nav>

      <div className={cn("connection-container", { connected })}>
        <div className="connection-button-container" style={{ display: "flex", gap: "8px" }}>
          {settings.resumptionToken ? (
            <button
              ref={refreshButtonRef}
              className={cn("action-button connect-toggle", { connected })}
              onClick={connected ? disconnect : handleConversation}
              disabled={isResuming}
              title="Продолжить предыдущую сессию"
              style={{ backgroundColor: "#4caf50" }}
            >
              <span className="material-symbols-outlined filled">
                {isResuming ? "pause" : "replay"}
              </span>
            </button>
          ) : (
            <button
              ref={connectButtonRef}
              className={cn("action-button connect-toggle", { connected })}
              onClick={connected ? disconnect : handleStartNewConversation}
              title="Начать новую сессию"
            >
              <span className="material-symbols-outlined filled">
                {connected ? "pause" : "play_arrow"}
              </span>
            </button>
          )}
        </div>


        <span className="text-indicator">Streaming</span>
      </div>
      {enableEditingSettings ? <SettingsDialog /> : ""}
    </section>
  );
}

export default memo(ControlTray);