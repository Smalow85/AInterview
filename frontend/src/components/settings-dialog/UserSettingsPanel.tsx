
import {
  ChangeEvent,
  FormEventHandler,
  useCallback
} from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { EditableUserSettings, UserSettings } from "../../types/settings";
import ResponseModalitySelector from "./ResponseModalitySelector";
import VoiceSelector from "./VoiceSelector";
import { useSettingsStore } from "../../lib/store-settings";
import { saveSettingsInDb } from "../../lib/storage/settings-storage";
import ThemeSelector from "./ThemeSelector";

const fieldLabels: { [key in keyof EditableUserSettings]: string } = {
  firstName: "First Name",
  lastName: "Last Name",
  language: "Language",
  email: "Email",
  systemInstruction: "System Prompt",
};


interface UserSettingsPanelProps {
  onClose: () => void;
}

export default function UserSettingsPanel({ onClose }: UserSettingsPanelProps) {
  const editableFields: (keyof EditableUserSettings)[] = ['firstName', 'lastName', 'email', 'language', 'systemInstruction'];
  const { config, setConfig } = useLiveAPIContext();
  const { settings, updateSettingsState, updateSettings } = useSettingsStore();

  const handleSettingChange: FormEventHandler<HTMLInputElement | HTMLSelectElement> = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateSettings({ ...settings, [e.target.name]: e.target.value });
    },
    [settings, updateSettings]
  );

  const saveSettings = useCallback(async () => {
    try {
      const userId = 1;
      const data: UserSettings = await saveSettingsInDb(settings, userId);
      console.log(data)
      setConfig({ ...config, systemInstruction: data.systemInstruction });
      updateSettingsState(data)
      onClose();
    } catch (error: any) {
      console.error("Error saving settings:", error);
    }
  }, [settings, setConfig, config, onClose, updateSettingsState]);

  if (!settings || Object.keys(settings).length === 0) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="user-settings-panel">
      <h3>User Settings</h3>
      <div className="mode-selectors">
        <ResponseModalitySelector />
        <VoiceSelector />
        <ThemeSelector />
      </div>

      <div>
        {Object.entries(settings)
          .filter(([key]) => editableFields.includes(key as keyof EditableUserSettings))
          .map(([key, value]) => (
            <div key={key} className="setting-row">
              <label htmlFor={key}>{fieldLabels[key as keyof typeof fieldLabels]}:</label>
              <input
                key={key}
                className="card-style-input"
                type="text"
                id={key}
                name={key}
                value={value || ""}
                onChange={handleSettingChange}
              />
            </div>
          ))}
      </div>
      <button className="save-button material-symbols-outlined" onClick={saveSettings}>
        Save
      </button>
    </div>
  );
}
