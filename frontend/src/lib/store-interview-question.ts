// frontend/live-api-web-console-main/src/lib/store-interview-question.ts

import { create } from "zustand";
import { InterviewPhase } from "../types/interview-question";
import { InterviewSettings } from "../types/settings";

interface InterviewQuestionsState {
    interview: InterviewSettings,
    updateInterview: (partialSettings: Partial<InterviewSettings>) => void;
    fetchQuestions: (sessionId: string, position: string) => Promise<InterviewPhase[]>;
}

const defaultInterview: InterviewSettings = {
    phases: [],
    position: '',
    interviewLoaded: false
};

export const useInterviewQuestionsStore = create<InterviewQuestionsState>((set) => ({
    interview: defaultInterview,
    interviewLoaded: false,
    fetchQuestions: async (sessionId, position) => {
        try {
            const response = await fetch(`http://localhost:8080/api/interview-questions/interview-plan/${sessionId}`);
            console.log(response)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: InterviewPhase[] = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching questions:", error);
            return [];
        }
    },
    updateInterview: (partialSettings: Partial<InterviewSettings>) => {
        console.log(partialSettings);
        set((state) => ({
            interview: { ...state.interview, ...partialSettings }, // Merge settings
        }));
    },
}));

