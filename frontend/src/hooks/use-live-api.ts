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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnhancedGenAILiveClient } from "../lib/client/enhanced-genai-live-client";
import { LiveClientOptions } from "../types";
import { LiveConnectConfig, StartSensitivity, EndSensitivity, LiveServerToolCall, FunctionDeclaration } from "@google/genai";
import { AudioStreamer } from "../lib/audio/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/audio/vol-meter";
import { useSettingsStore } from "../lib/store-settings";
import { PromptConstructor } from "../lib/promptConstructor";
import { useThemedConversationStore } from "../lib/store-conversation";
import { useInterviewQuestionsStore } from "../lib/store-interview";
import {
  advance_interview_declaration,
  ask_question,
  evaluate_answer_declaration,
  provide_feedback,
  advance_themed_conversation,
  evaluate_themed_answer,
  ask_challenging_question,
  provide_answer
} from "../types/tool-types";

export type UseLiveAPIResults = {
  client: EnhancedGenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: (config: LiveConnectConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const [model, setModel] = useState<string>("models/gemini-live-2.5-flash-preview");
  const [config, setConfig] = useState<LiveConnectConfig>(
    {
      systemInstruction: '',
      contextWindowCompression: { slidingWindow: {} },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
          prefixPaddingMs: 30,
          silenceDurationMs: 300,
        }
      },
      inputAudioTranscription: { enabled: true },
      outputAudioTranscription: { enabled: true },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [] },
      ],
    }
  );
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const { settings, settingsLoaded } = useSettingsStore();
  const { interview } = useInterviewQuestionsStore()
  const { themedConversation } = useThemedConversationStore();
  const promptConstructor = new PromptConstructor();

  const client = useMemo(() => new EnhancedGenAILiveClient(options), [options]);

  async function setupLiveAPIConfig(): Promise<LiveConnectConfig> {
    let initialSystemPrompt = null;
    let newConfig: LiveConnectConfig = { // Initialize newConfig with a default value
      systemInstruction: '',
      contextWindowCompression: { slidingWindow: {} },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 30,
            silenceDurationMs: 1500,
          }
        },
        inputAudioTranscription: { enabled: true },
        outputAudioTranscription: { enabled: true },
        tools: [
          { googleSearch: {} },
        { functionDeclarations: [] },
      ],
  };

    if (settings.sessionType === 'interview') {
      initialSystemPrompt = promptConstructor.constructInterviewInitialSystemPrompt(interview);
      newConfig = {
        systemInstruction: initialSystemPrompt || settings.systemInstruction,
        inputAudioTranscription: { enabled: true },
        outputAudioTranscription: { enabled: true },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 30,
            silenceDurationMs: 1500,
          }
        },
        sessionResumption: { handle: settings.resumptionToken },
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: [
              evaluate_answer_declaration,
              advance_interview_declaration,
              ask_question,
              provide_feedback]
          },
        ],
    };
    }
    if (settings.sessionType === 'themed_interview') {
      initialSystemPrompt = promptConstructor.constructThemedConversationInitialSystemPrompt(themedConversation);
      newConfig = {
        systemInstruction: initialSystemPrompt || settings.systemInstruction,
        inputAudioTranscription: { enabled: true },
        outputAudioTranscription: { enabled: true },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 30,
            silenceDurationMs: 1500,
          }
        },
        sessionResumption: { handle: settings.resumptionToken },
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: [advance_themed_conversation,
              evaluate_themed_answer,
              ask_challenging_question,
              provide_answer
            ]
          },
        ],
    };
    }
    if (settings.sessionType === 'default') {
      newConfig = {
        systemInstruction: initialSystemPrompt || settings.systemInstruction,
        inputAudioTranscription: { enabled: true },
        outputAudioTranscription: { enabled: true },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 30,
            silenceDurationMs: 1500,
          }
        },
        sessionResumption: { handle: settings.resumptionToken },
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: []
          },
        ],
    };
    }
    return newConfig;
  }

  const connectWithConfig = async (config: LiveConnectConfig) => {
    if (config && config.systemInstruction) {
      try {
        await connect(config);
      } catch (error) {
        console.error("Error connecting to Live API:", error);
      }
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      if (!audioStreamerRef.current) {
        const audioCtx = await audioContext({ id: "audio-out" });
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        await audioStreamerRef.current.addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
          setVolume(ev.data.volume);
        });
      }
    };
    setupAudio();
  }, []);

  useEffect(() => {
    const connectToLiveAPI = async () => {
      if (settingsLoaded || settings.sessionActive) {
        try {
          const newConfig = await setupLiveAPIConfig();
          setConfig(newConfig);
          await connectWithConfig(newConfig);
        } catch (error) {
          console.error("Error setting up Live API config:", error);
          return;
        }
      }
    };
    connectToLiveAPI();
  }, [settings.sessionActive, interview, themedConversation]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const onError = (error: ErrorEvent) => {
      console.error("error", error);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    const onToolCall = (toolCall: LiveServerToolCall) => {
      console.log(`got toolcall`, toolCall);
    };

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("toolcall", onToolCall);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("toolcall", onToolCall)
        .disconnect();
    };
  }, [client, audioStreamerRef]);
  
  const connect = useCallback(async (config: LiveConnectConfig) => {
    if (!config) {
      throw new Error("config has not been set");
    }
    console.log('config', config);
    client.disconnect();
    await client.connect(model, config);
  }, [client, config, model]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
  };
}
