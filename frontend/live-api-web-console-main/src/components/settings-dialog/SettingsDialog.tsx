import {
  ChangeEvent,
  FormEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";
import "./settings-dialog.scss";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import ResponseModalitySelector from "./ResponseModalitySelector";
import VoiceSelector from "./VoiceSelector";
import { useSettingsStore } from "../../lib/store-settings";
import { UserSettings } from "../../types/settings";

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config, setConfig } = useLiveAPIContext();
  const { settings, updateSettings, fetchSettings } = useSettingsStore(); //Import from store


  const handleSettingChange: FormEventHandler<HTMLInputElement> = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateSettings({ ...settings, [e.target.name]: e.target.value }); //Directly pass the new object
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
      setConfig({ ...config, systemInstruction: data.systemInstructions }); //Update config
      updateSettings(data)
      setOpen(false);
    } catch (error: any) {
      setError(error.message);
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
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
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="setting-row">
                <label htmlFor={key}>{key.replace(/_/g, " ")}:</label>
                <input
                  className="system-small"
                  type="text"
                  id={key}
                  name={key} // Add name attribute
                  value={value || ""}
                  onChange={handleSettingChange}
                />
              </div>
            ))}
          </div>
          <button className="action-button material-symbols-outlined" onClick={saveSettings}>
            <h2>Save</h2>
          </button>
        </div>
      </dialog>
    </div>
  );
}