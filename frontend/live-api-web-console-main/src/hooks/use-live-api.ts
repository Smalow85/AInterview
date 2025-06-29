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
  description: "Оценить ответ кандидата и определить следующие шаги",
  parameters: {
    type: Type.OBJECT,
    properties: {
      score: {
        type: Type.STRING,
        description: "Оценка ответа от 1 до 10",
        minimum: 1,
        maximum: 10
      },
      keywords_found: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Найденные ключевые слова в ответе"
      },
      completeness: {
        type: Type.NUMBER,
        description: "Полнота ответа от 0 до 1",
        minimum: 0,
        maximum: 1
      },
      needs_followup: {
        type: Type.BOOLEAN,
        description: "Нужны ли уточняющие вопросы"
      },
      followup_question: {
        type: Type.STRING,
        description: "Уточняющий вопрос, если needs_followup = true"
      },
      next_action: {
        type: Type.STRING,
        enum: ["ask_followup", "next_question", "next_phase", "complete_interview"],
        description: "Следующее действие в интервью"
      }
    },
    required: ["score", "completeness", "needs_followup", "next_action"]
  }
};

const advance_interview_declaration: FunctionDeclaration = {
  name: "advance_interview",
  description: "Перейти к следующему вопросу или фазе интервью",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["next_question", "next_phase", "complete"],
        description: "Тип перехода"
      },
      reason: {
        type: Type.STRING,
        description: "Причина перехода"
      }
    },
    required: ["action"]
  }
};

const ask_question: FunctionDeclaration = {
  name: "ask_question",
  description: "Задать текущий вопрос кандидату",
  parameters: {
    type: Type.OBJECT,
    properties: {
      question_text: {
        type: Type.STRING,
        description: "Текст вопроса для кандидата"
      },
      additional_context: {
        type: Type.STRING,
        description: "Дополнительный контекст или пояснения к вопросу"
      }
    },
    required: ["question_text"]
  }
};

const provide_feedback: FunctionDeclaration = {
  name: "provide_feedback",
  description: "Дать обратную связь кандидату",
  parameters: {
    type: Type.OBJECT,
    properties: {
      feedback_type: {
        type: Type.STRING,
        enum: ["encouragement", "hint", "clarification", "final_feedback"],
        description: "Тип обратной связи"
      },
      message: {
        type: Type.STRING,
        description: "Сообщение с обратной связью"
      }
    },
    required: ["feedback_type", "message"]
  }
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new EnhancedGenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const [model, setModel] = useState<string>("models/gemini-live-2.5-flash-preview");
  const [config, setConfig] = useState<LiveConnectConfig>(
    {
      systemInstruction: '',
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
        { functionDeclarations: [evaluate_answer_declaration, provide_feedback] },
      ],
    }
  );
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const { settings, sessionType, settingsLoading, sessionActive } = useSettingsStore();
  const { phases, position, phasesLoading } = useInterviewQuestionsStore()
  const promptConstructor = new PromptConstructor();

  const interviewBot = useMemo(() => client.interviewBot, [client]);

  async function setupLiveAPIConfig() {
    var initialSystemPrompt = null;
    if (sessionType === 'interview') {
      interviewBot._initializeInterviewStructure(phases, position)
      initialSystemPrompt = promptConstructor.constructInitialSystemPrompt(interviewBot, phases);
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
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [evaluate_answer_declaration, advance_interview_declaration, ask_question, provide_feedback] },
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
    console.log(settings)
    console.log(sessionType)
    const connectToLiveAPI = async () => {
      if (!settingsLoading && (!phasesLoading || sessionType === 'default') && settings.activeSessionId) {  //Check if stores and session are ready
        try {
          await setupLiveAPIConfig();
          await connect();
          client.startInterview();
        } catch (error) {
          console.error("Error connecting to Live API:", error);
        }
      }
    };
    connectToLiveAPI();
  }, [settingsLoading, phasesLoading, settings.activeSessionId, sessionType, sessionActive]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      // Send initial greeting/question once connected
      //const currentQuestion = client.interviewBot.get_current_question();
      //client.send({
      //  text: `Начни интервью с приветствия и первого вопроса: ${currentQuestion ? currentQuestion.text : ''}`
      //}, true);
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
      .on("audio", onAudio);
      //.on("toolcall", onToolCall);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        //.off("toolcall", onToolCall)
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
