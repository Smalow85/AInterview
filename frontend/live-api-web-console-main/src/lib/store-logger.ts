/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0`r
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { create } from "zustand";
import { ChatMessage } from "./store-chat";
import { getCurrentUserSettingsAsync } from "./store-settings";
import { fetchMessagesBySessionId, clearAllMessages } from "./storage/chat-storage";

interface StoreChatState {
  maxLogs: number;
  messages: ChatMessage[];
  addMessage: (chatMessage: ChatMessage) => void;
  clearMessages: () => void;
  fetchMessages: () => Promise<void>;
  loading: boolean;
}

export const useLoggerStore = create<StoreChatState>((set) => ({
  maxLogs: 4,
  messages: [],
  loading: true,
  addMessage: (chatMessage) => {
    set((state) => {
      const prevLog = state.messages.at(-1);
      if (prevLog && prevLog.message === chatMessage.message) {
        return {
          messages: [
            ...state.messages.slice(0, -1),
            { ...prevLog },
          ],
        };
      }
      return {
        messages: [
          ...state.messages.slice(-(state.maxLogs - 1)),
          { ...chatMessage, count: 1 },
        ],
      };
    });
  },
  fetchMessages: async () => {
    try {
      const user = await getCurrentUserSettingsAsync();
      const data = await fetchMessagesBySessionId(user.activeSessionId)
      set({ messages: data, loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loading: false });
    }
  },
  clearMessages: async () => {
    try {
      await clearAllMessages();
      set({ messages: [], loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loading: false });
    }
  },
  setMaxLogs: (n: number) => set({ maxLogs: n }),
}));
