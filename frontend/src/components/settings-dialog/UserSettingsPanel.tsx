import React, { useCallback, ChangeEvent, FormEventHandler } from 'react';
import { useSettingsStore } from '../../lib/store-settings';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { EditableUserSettings, UserSettings } from '../../types/settings';
import { saveSettingsInDb } from '../../lib/storage/settings-storage';
import ResponseModalitySelector from "./ResponseModalitySelector";
import VoiceSelector from "./VoiceSelector";

const fieldLabels: { [key in keyof EditableUserSettings]: string } = {
  firstName: "First Name",
  lastName: "Last Name",
  language: "Language",
  email: "Email",
  systemInstruction: "System Prompt",
};

const UserSettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { config, setConfig } = useLiveAPIContext();

  const handleSettingChange: FormEventHandler<HTMLInputElement> = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateSettings({ ...settings, [e.target.name]: e.target.value });
    },
    [settings, updateSettings]
  );

  const saveSettings = useCallback(async () => {
    try {
      const userId = 1;
      const data: UserSettings = await saveSettingsInDb(settings, userId);
      setConfig({ ...config, systemInstruction: data.systemInstruction });
      updateSettings(data);
    } catch (error: any) {
      console.error("Error saving settings:", error);
    }
  }, [settings, setConfig, config, updateSettings]);

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-info-card">
      <div className="card-header">
        <h2>User Settings</h2>
      </div>
      <div className="user-details">
        {Object.entries(settings)
          .filter(([key]) => Object.keys(fieldLabels).includes(key))
          .map(([key, value]) => (
            <div key={key} className="detail-item">
              <label htmlFor={key}>{fieldLabels[key as keyof typeof fieldLabels]}:</label>
              <input
                type="text"
                id={key}
                name={key}
                value={value || ""}
                onChange={handleSettingChange}
              />
            </div>
          ))}
      </div>
      <div className="selectors-container">
        <ResponseModalitySelector />
        <VoiceSelector />
      </div>
      <div className="detail-item">
        <label htmlFor="theme">Theme:</label>
        <select
          id="theme"
          name="theme"
          value={settings.theme || "dark"}
          onChange={(e) => updateSettings({ ...settings, theme: e.target.value })}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <button className="save-button" onClick={saveSettings}>
        Save Settings
      </button>
    </div>
  );
};

export default UserSettingsPanel;
