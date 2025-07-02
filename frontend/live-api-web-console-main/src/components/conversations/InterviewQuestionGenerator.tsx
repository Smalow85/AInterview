import React, { useState, useRef } from 'react';
import './InterviewQuestionGenerator.scss';
import { useSettingsStore } from '../../lib/store-settings';
import { InterviewPhase } from '../../types/interview-question';
import { useInterviewQuestionsStore } from '../../lib/store-interview-question';


export interface InterviewRequest {
    sessionId: string;
    jobTitle: string;
    requiredExperience: string;
    resumeContent: string;
    keySkills: string[];
}

const InterviewQuestionGenerator = (props: { onClose: () => void }) => {
    const [selectedFileName, setSelectedFileName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [requiredExperience, setRequiredExperience] = useState('');
    const [resumeContent, setResumeContent] = useState('');
    const [keySkills, setKeySkills] = useState<string[]>([]);
    const [generatedQuestions, setGeneratedQuestions] = useState<InterviewPhase[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCloseButton, setShowCloseButton] = useState(false);
    const { settings, updateSettings } = useSettingsStore();
    const { updateInterview } = useInterviewQuestionsStore();
    const sessionId = settings.activeSessionId;
    const { onClose } = props;

    const handleGenerate = async () => {
        if (!sessionId) {
            setError('Session ID is required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const requestBody: InterviewRequest = {
                sessionId,
                jobTitle,
                requiredExperience,
                resumeContent,
                keySkills,
            };
            const response = await fetch(`http://localhost:8080/api/interview-questions/interview-plan/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setGeneratedQuestions(data.phases);
            updateInterview({interviewLoaded: true})
            updateSettings({sessionActive: true, sessionType: 'interview'});
            setShowCloseButton(true);
        } catch (error) {
            console.log("Error:", error)
            setError("Error")
        } finally {
            setLoading(false);
        }
    };

    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setResumeContent(e.target?.result as string);
            };
            reader.readAsText(file);
            setSelectedFileName(file.name);
        } else {
            setResumeContent('');
            setSelectedFileName('');
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
                    <label htmlFor="jobTitle">Desired role:</label>
                    <input type="text" id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>

                <div className="setting-row">
                    <label htmlFor="requiredExperience">Required expirience:</label>
                    <input type="text" id="requiredExperience" value={requiredExperience} onChange={(e) => setRequiredExperience(e.target.value)} />
                </div>
                <div className="setting-row">
                    <label>CV:</label>
                </div>
                <div>
                    <button className="file-upload-button" onClick={handleFileClick}>
                        Select file
                    </button>
                    <input type="file" id="resume" ref={hiddenFileInput} onChange={handleResumeChange} style={{ display: 'none' }} />
                    <div className="setting-row">
                        {selectedFileName && <p>Selected file: {selectedFileName}</p>}
                    </div>
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
                <button className="generate-button" onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            )}
            {error && <p className="error">{error}</p>}
            <h2>Generated questions:</h2>
            <ul>
                {generatedQuestions.map((question, index) => (
                    <li key={index}>{question.name}</li>
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

export default InterviewQuestionGenerator;