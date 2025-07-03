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
import { EnhancedGenAILiveClient } from "../lib/enhanced-genai-live-client";
import { LiveClientOptions } from "../types";
import { LiveConnectConfig, StartSensitivity, EndSensitivity, LiveServerToolCall } from "@google/genai";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { useSettingsStore } from "../lib/store-settings";
import { PromptConstructor } from "../lib/promptConstructor";
import { useThemedConversationStore } from "../lib/store-conversation";
import { useInterviewQuestionsStore } from "../lib/store-interview-question";
import {
  advance_interview_declaration,
  ask_question,
  evaluate_answer_declaration,
  provide_feedback,
  advanceThemedConversation,
  evaluateThemedAnswer,
  askChallengingQuestion
} from "../types/tool-types";

export type UseLiveAPIResults = {
  client: EnhancedGenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new EnhancedGenAILiveClient(options), [options]);
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

  const interviewBot = useMemo(() => client.interviewBot, [client]);
  const conversationBot = useMemo(() => client.conversationBot, [client]);

  async function setupLiveAPIConfig() {
    console.log(settings)
    var initialSystemPrompt = null;
    if (settings.sessionType === 'interview') {
      console.log("interview", interview)
      interviewBot._initializeInterviewStructure(interview)
      initialSystemPrompt = promptConstructor.constructInterviewInitialSystemPrompt(interviewBot);
      console.log(interviewBot)
    }
    if (settings.sessionType === 'themed_interview') {
      console.log('theme', themedConversation)
      conversationBot._initializeThemedConversationStructure(themedConversation.learningGoals, themedConversation.theme)
      console.log(conversationBot);
      initialSystemPrompt = promptConstructor.constructThemedConversationInitialSystemPrompt(conversationBot, themedConversation);
    }
    setConfig({
      systemInstruction: initialSystemPrompt || settings.systemInstruction,
      inputAudioTranscription: { enabled: true },
      outputAudioTranscription: { enabled: true },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
          prefixPaddingMs: 30,
          silenceDurationMs: 300,
        }
      },
      //sessionResumption: { handle: settings.resumptionToken },
      tools: [
        { googleSearch: {} },
        {
          functionDeclarations: [evaluate_answer_declaration,
            advance_interview_declaration,
            ask_question,
            provide_feedback,
            advanceThemedConversation,
            evaluateThemedAnswer,
            askChallengingQuestion
          ]
        },
      ],
    });
  }

  const connectWithConfig = async () => {
    if (config && config.systemInstruction) {
      try {
        await connect();
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
      console.log('connectToLiveAPI')
      if (settingsLoaded || settings.sessionActive) {
        try {
          await setupLiveAPIConfig();
          await connectWithConfig();
        } catch (error) {
          console.error("Error setting up Live API config:", error);
          return;
        }
      }
    };
    connectToLiveAPI();
  }, [settings, themedConversation, interview]);

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
  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
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
