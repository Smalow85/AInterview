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
import { saveSettingsInDb, getSettings } from "./storage/settings-storage";
import { UserSettings } from "../types/settings";

interface SettingsState {
  settings: UserSettings;
  updateSettingsState: (settings: UserSettings) => void;
  updateSettings: (partialSettings: Partial<UserSettings>) => void;
  updateTransientSettings: (partialSettings: Partial<UserSettings>) => void;
  persistUpdates: (settings: UserSettings) => void;
  fetchSettings: () => Promise<UserSettings | undefined>;
  settingsLoaded: boolean
}

const defaultUserSettings: UserSettings = {
  id: 1,
  firstName: 'Evgeny',
  lastName: 'Kononov',
  activeSessionId: '',
  systemInstruction: 'You are helpful assistant',
  sessionActive: false
};

export const getCurrentUserSettingsAsync = async (): Promise<UserSettings> => {
  await useSettingsStore.getState().fetchSettings(); // Wait for settings to load
  return useSettingsStore.getState().settings;
};

export const updateSettingsAsync = async (partialSettings: Partial<UserSettings>) => {
  useSettingsStore.getState().updateTransientSettings(partialSettings)
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultUserSettings,
  sessionType: '',
  settingsLoaded: false,
  cards: [],
  sessionActive: false,
  updateSettingsState: (settings) => {
    set((state) => ({
      ...state.settings, settings: settings,
    }));
  },
  updateSettings: async (partialSettings: Partial<UserSettings>) => {
    console.log(partialSettings);
    set((state) => {
      const updatedSettings = { ...state.settings, ...partialSettings };
      saveSettingsInDb(updatedSettings, updatedSettings.id);
      return { settings: updatedSettings };
    });
  },
  updateTransientSettings: async (partialSettings: Partial<UserSettings>) => {
    console.log(partialSettings);
    set((state) => {
      const updatedSettings = { ...state.settings, ...partialSettings };
      return { settings: updatedSettings };
    });
  },
  persistUpdates: async (settings) => {
    const userId = defaultUserSettings.id;
    await saveSettingsInDb(settings, userId);
  },
  fetchSettings: async (): Promise<UserSettings | undefined> => {
    try {
      const userId = defaultUserSettings.id
      let settings = await getSettings(userId);

      if (isEmpty(settings)) { // Check if settings are empty
        settings = defaultUserSettings;  // Use default settings
        await saveSettingsInDb(settings, userId); // Save default settings
      }
      set({ settings, settingsLoaded: true });
      return settings;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },
}));

const isEmpty = (obj: any): boolean => {
  return Object.keys(obj).length === 0;
};