import React, { useState, useRef } from 'react';
import './SimpleConversationGenerator.scss';
import { useSettingsStore } from '../../lib/store-settings';


export interface InterviewRequest {
    sessionId: string;
    jobTitle: string;
    requiredExperience: string;
    resumeContent: string;
    keySkills: string[];
}

const SimpleConversationGenerator = (props: { onClose: () => void }) => {
    const [jobTitle, setJobTitle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCloseButton, setShowCloseButton] = useState(false);
    const { updateSettings } = useSettingsStore();
    const { onClose } = props;

    const handleGenerate = async () => {
        updateSettings({sessionActive: true, sessionType: 'default', activeSessionId: crypto.randomUUID()});
        setLoading(true);
        setError('');
        try {
            setShowCloseButton(true);
            onClose();
        } catch (error) {
            console.log("Error:", error)
            setError("Error")
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="interview-question-generator">
            <div className="setting-row">
                <label htmlFor="jobTitle">Desired role:</label>
                <input type="text" id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="card-style-input" />
            </div>
            <button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Starting...' : 'Start'}
            </button>
            {error && <p className="error">{error}</p>}

            {showCloseButton && (
                <button onClick={() => {
                    setShowCloseButton(false);
                }}>Close</button>
            )}
        </div>
    );
};

export default SimpleConversationGenerator;