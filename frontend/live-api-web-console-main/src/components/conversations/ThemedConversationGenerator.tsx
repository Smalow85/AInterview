import React, { useState, useRef } from 'react';
import './InterviewQuestionGenerator.scss';
import { useSettingsStore } from '../../lib/store-settings';
import { LeariningGoal } from '../../types/interview-question';
import { useThemedConversationStore } from '../../lib/store-conversation';


export interface ThemedConversationRequest {
    theme: string;
    keySkills: string[];
}

const ThemedConversationGenerator = (props: { onClose: () => void }) => {
    const [theme, setTheme] = useState('');
    const [keySkills, setKeySkills] = useState<string[]>([]);
    const [generatedQuestions, setGeneratedQuestions] = useState<LeariningGoal[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCloseButton, setShowCloseButton] = useState(false);
    const { settings, updateSettings } = useSettingsStore();
    const sessionId = settings.activeSessionId;
    const { updateConversation } = useThemedConversationStore();
    const { onClose } = props;

    const handleGenerate = async (theme: string, keySkills: string[]) => {
        if (!sessionId) {
            setError('Session ID is required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const requestBody: ThemedConversationRequest = {
                theme: theme,
                keySkills: keySkills
            };
            const response = await fetch(`http://localhost:8080/api/themed-conversation/themed-conversation-plan/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            console.log('got response', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setGeneratedQuestions(data.learningGoals);
            updateConversation({ theme: theme, learningGoals: data.learningGoals, conversationLoaded: true})
            updateSettings({sessionActive: true, sessionType: 'themed_interview'});
            setShowCloseButton(true);
        } catch (error) {
            console.log("Error:", error)
            setLoading(false)
            setError("Error")
        }
    };

    const handleKeySkillChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newKeySkills = [...keySkills];
        newKeySkills[index] = e.target.value;
        setKeySkills(newKeySkills);
    };

    const addKeySkill = () => {
        setKeySkills([...keySkills, '']);
    };

    const removeKeySkill = (index: number) => {
        setKeySkills(keySkills.filter((_, i) => i !== index));
    };


    return (
        <div id="interview-question-generator">
            {generatedQuestions.length === 0 && (
            <div id="input-fields-section">
                <div className="setting-row">
                    <label htmlFor="jobTitle">Theme:</label>
                    <input type="text" id="jobTitle" value={theme} onChange={(e) => setTheme(e.target.value)} />
                </div>
                <div className="setting-row">
                    <label htmlFor="key-skills">Key skills:</label>
                </div>
                <div className="key-skills">
                    {keySkills.map((skill, index) => (
                        <div key={index} className="key-skill-item">
                            <input type="text" value={skill} onChange={(e) => handleKeySkillChange(e, index)} />
                            <button onClick={() => removeKeySkill(index)}>Remove</button>
                        </div>

                    ))}
                    <button onClick={addKeySkill}>Add skill</button>
                </div>
                <button className="generate-button" onClick={() => handleGenerate(theme, keySkills)} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            )}
            {error && <p className="error">{error}</p>}
            <h2>Generated questions:</h2>
            <ul>
                {generatedQuestions.map((question, index) => (
                    <li key={index}>{question.text}</li>
                ))}
            </ul>
            {showCloseButton && (
                <button className="start-button" onClick={
                    () => {
                        onClose();
                    }}>Go</button>
            )}
        </div>
    );
};

export default ThemedConversationGenerator;