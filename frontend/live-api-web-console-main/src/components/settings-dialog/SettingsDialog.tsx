import {
  ChangeEvent,
  FormEventHandler,
  useCallback,
  useState
} from "react";
import "./settings-dialog.scss";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { EditableUserSettings } from "../../types/settings";
import ResponseModalitySelector from "./ResponseModalitySelector";
import VoiceSelector from "./VoiceSelector";
import { useSettingsStore } from "../../lib/store-settings";
import { UserSettings } from "../../types/settings";

const fieldLabels: {[key in keyof EditableUserSettings]: string} = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  systemInstruction: "System Prompt",
};

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const editableFields: (keyof EditableUserSettings)[] = ['firstName', 'lastName', 'email', 'systemInstruction'];
  const { config, setConfig } = useLiveAPIContext();
  const { settings, updateSettingsState, updateSettings } = useSettingsStore();

  const handleSettingChange: FormEventHandler<HTMLInputElement> = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateSettings({ ...settings, [e.target.name]: e.target.value });
    },
    [settings, updateSettings]
  );

  const saveSettings = useCallback(async () => {
    try {
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
      const data: UserSettings = await response.json();
      setConfig({ ...config, systemInstruction: data.systemInstruction });
      updateSettingsState(data)
      setOpen(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
    } finally {
  
    }
  }, [settings, setConfig, config]);

  return (
    <div className="settings-dialog">
      <button className="action-button material-symbols-outlined"
        onClick={() => setOpen(!open)}>
          Settings
      </button>
      <dialog className="dialog" style={{ display: open ? "block" : "none" }}>
        <div className="dialog-container">
          <h3>User Settings</h3>
          <div className="mode-selectors">
            <ResponseModalitySelector />
            <VoiceSelector />
          </div>
          <div>
            {Object.entries(settings)
              .filter(([key]) => editableFields.includes(key as keyof EditableUserSettings))
              .map(([key, value]) => (
              <div key={key} className="setting-row">
                <label htmlFor={key}>{fieldLabels[key as keyof typeof fieldLabels]}:</label>
                <input
                  key={key}
                  className="system-small"
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
      </dialog>
    </div>
  );
}