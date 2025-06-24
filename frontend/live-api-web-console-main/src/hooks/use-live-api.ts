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
import { LiveConnectConfig } from "@google/genai";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { useSettingsStore } from "../lib/store-settings";
import { PromptConstructor } from "../lib/promptConstructor";

import {
  FunctionDeclaration,
  Type,
} from "@google/genai";
import { useInterviewQuestionsStore } from "../lib/store-interview-question";
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

const evaluate_answer_declaration: FunctionDeclaration = {
  name: "evaluate_answer",
  description: "Evaluate candidate's technical answer",
  parameters: {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "Score from 1-10" }, // Changed to NUMBER for consistency, adjust as needed
      keywords_found: { type: Type.ARRAY, items: { type: Type.STRING } },
      needs_followup: { type: Type.BOOLEAN },
      next_action: { type: Type.STRING },
    },
    required: ["score", "needs_followup", "next_action"],
  },
};

const advance_interview_declaration: FunctionDeclaration = {
  name: "advance_interview",
  description: "Move to next question or phase",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["next_question", "next_phase", "complete"] },
      reason: { type: Type.STRING },
    },
    required: ["action"],
  },
};

const summarize_declaration: FunctionDeclaration = {
  name: "summarize",
  description: "Summarize recent messages from chat history"
};

const get_context_declaration: FunctionDeclaration = {
  name: "get_context",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description:
          "user entered prompt that must be enriched with context from knowledge base"
      },
    },
    required: ["prompt"],
  },
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new EnhancedGenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const [model, setModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [config, setConfig] = useState<LiveConnectConfig>(
    {
      systemInstruction: '',
      inputAudioTranscription: { enabled: true },
      outputAudioTranscription: { enabled: true },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [evaluate_answer_declaration, advance_interview_declaration, summarize_declaration, get_context_declaration] },
      ],
    }
  );
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const { settings, settingsLoading} = useSettingsStore();
  const { phases, position, phasesLoading  } = useInterviewQuestionsStore()
  const promptConstructor = new PromptConstructor();

  const interviewBot = useMemo(() => client.interviewBot, [client]);

  async function setupLiveAPIConfig() {
    console.log(phases)
    console.log(settings)
    interviewBot._initializeInterviewStructure(phases, position)
    const initialSystemPrompt = promptConstructor.constructInitialSystemPrompt(interviewBot, phases);
    setConfig({
          systemInstruction: initialSystemPrompt,
          inputAudioTranscription: { enabled: true },
          outputAudioTranscription: { enabled: true },
          tools: [
            { googleSearch: {} },
            { functionDeclarations: [summarize_declaration, get_context_declaration] },
          ],
    });
  }

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
      if (!settingsLoading && !phasesLoading && settings.activeSessionId) {  //Check if stores and session are ready
        try {
          await setupLiveAPIConfig();
          await connect();
          setConnected(true);
          console.log("connected, config is:", config)
        } catch (error) {
          console.error("Error connecting to Live API:", error);
        }
      }
    };
    connectToLiveAPI();
  }, [settingsLoading, phasesLoading, settings.activeSessionId]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      // Send initial greeting/question once connected
      const currentQuestion = client.interviewBot.get_current_question();
      client.send({
        text: `Начни интервью с приветствия и первого вопроса: ${currentQuestion ? currentQuestion.text : ''}`
      }, true);
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

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
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
