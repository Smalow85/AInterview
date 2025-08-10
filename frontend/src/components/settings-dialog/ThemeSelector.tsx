import { useCallback, useState, useEffect } from "react";
import Select from "react-select";
import { useSettingsStore } from "../../lib/store-settings";

const themeOptions = [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
];

export default function ThemeSelector() {
    const { settings, updateSettings } = useSettingsStore();

    const handleUpdate = useCallback(
        (theme: string) => {
            console.log(theme);
            updateSettings({
                ...settings,
                theme: theme,
            });
        },
        [settings, updateSettings]
    );



    useEffect(() => {
        // Find the matching option from themeOptions
        const initialOption = themeOptions.find((option) => option.value === settings?.theme);
        setSelectedOption(initialOption || null); // Set it to null if no match
    }, [settings?.theme]);

    const [selectedOption, setSelectedOption] = useState<{
        value: string;
        label: string;
    } | null>(null);

    return (
        <div className="select-group">
            <label htmlFor="response-modality-selector">Theme</label>
            <Select
                id="theme-modality-selector"
                className="react-select"
                classNamePrefix="react-select"
                defaultValue={selectedOption}
                options={themeOptions}
                onChange={(e) => {
                    setSelectedOption(e);
                    if (e) {
                        handleUpdate(e.value);
                    }
                }}
            />
        </div>
    );
}
