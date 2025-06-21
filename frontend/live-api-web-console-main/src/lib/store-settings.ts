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

import { create } from "zustand";
import { UserSettings } from "../types/settings";

interface SettingsState {
  settings: UserSettings;
  updateSettingsState: (settings: UserSettings) => void;
  updateSettings: (partialSettings: Partial<UserSettings>) => void; 
  persistUpdates: (settings: UserSettings) => void;
  fetchSettings: () => Promise<UserSettings | undefined>;

}

const defaultUserSettings: UserSettings = {
    id: 1,
    firstName: 'Evgeny',
    lastName: 'Kononov',
    activeSessionId: '1234567890',
    systemInstruction: 'You are helpful assistant'
};

export const getCurrentUserSettingsAsync = async () => {
  await useSettingsStore.getState().fetchSettings();
  return useSettingsStore.getState().settings;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultUserSettings,
  cards: [],
  updateSettingsState: (settings) => {
    set((state) => ({
        ...state.settings, settings: settings,
    }));
  },
  updateSettings: (partialSettings: Partial<UserSettings>) => { 
    console.log(partialSettings);//Updated type
    set((state) => ({
      settings: { ...state.settings, ...partialSettings }, // Merge settings
    }));
  },
  persistUpdates: async (settings) => {
    console.log(settings)
    const userId = 1;
    const response = await fetch(`http://localhost:8080/api/settings/${userId}/save`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...settings }),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
  fetchSettings: async () => {
    try {
      const userId = defaultUserSettings.id
      const response = await fetch(`http://localhost:8080/api/settings/${userId}`); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: UserSettings = await response.json();
      set({settings: data});
      return data
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },
}));