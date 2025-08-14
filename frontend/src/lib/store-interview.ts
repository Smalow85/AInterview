// frontend/live-api-web-console-main/src/lib/store-interview-question.ts

import { create } from "zustand";
import { InterviewPhase, Question } from "../types/interview-question";
import { InterviewSettings } from "../types/settings";
import { saveInterviewToDB, fetchInterviewBySessionId } from "./storage/interview-storage";


interface InterviewQuestionsState {
    interview: InterviewSettings,
    patchInterview: (partialSettings: Partial<InterviewSettings>) => void;
    updateInterview: (interviewSettings: InterviewSettings) => void;
    fetchQuestions: (sessionId: string, position: string) => Promise<InterviewPhase[]>;
    getInterviewBySessionId: (sessionId: string) => Promise<InterviewSettings>;
    advanceInterviewToNextQuestion: (interview: InterviewSettings) => void;
    advanceInterviewToNextPhase: (interview: InterviewSettings) => void;
    getCurrentPhase: (interview: InterviewSettings) => InterviewPhase;
}

const defaultInterview: InterviewSettings = {
    activeSessionId: '',
    phases: [],
    position: '',
    currentPhaseIndex: 0,
    currentQuestionIndex: 0,
    interviewLoaded: false,
    active: false
};

export const getInterview = async (sessionId: string): Promise<InterviewSettings> => {
    await useInterviewQuestionsStore.getState().getInterviewBySessionId(sessionId); // Wait for settings to load
    return useInterviewQuestionsStore.getState().interview;
};

export const updateInterview = async (interview: InterviewSettings): Promise<InterviewSettings> => {
    useInterviewQuestionsStore.getState().updateInterview(interview); // Wait for settings to load
    return useInterviewQuestionsStore.getState().interview;
};

export const advanceToNextQuestion = async (interview: InterviewSettings): Promise<InterviewSettings> => {
    useInterviewQuestionsStore.getState().advanceInterviewToNextQuestion(interview); // Wait for settings to load
    return useInterviewQuestionsStore.getState().interview;
};

export const advanceToNextPhase = async (interview: InterviewSettings): Promise<InterviewSettings> => {
    useInterviewQuestionsStore.getState().advanceInterviewToNextPhase(interview); // Wait for settings to load
    return useInterviewQuestionsStore.getState().interview;
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
    updateInterview: (interviewSettings: InterviewSettings) => {
        saveInterviewToDB(interviewSettings);
        set((state) => ({
            interview: interviewSettings
        }));
    },
    patchInterview: (partialSettings: Partial<InterviewSettings>) => {
        console.log(partialSettings);
        set((state) => {
            const interview = { ...state.interview, ...partialSettings };
            saveInterviewToDB(interview);
            return { interview: interview };
        });
    },
    getInterviewBySessionId: async (sessionId: string) => {
        return fetchInterviewBySessionId(sessionId);
    },
    getCurrentPhase: (interview: InterviewSettings) => {
        return interview.phases[interview.currentPhaseIndex];
    },
    advanceInterviewToNextQuestion: async(interview: InterviewSettings) => {
        const currentPhase = interview.phases[interview.currentPhaseIndex];
        if (interview.currentPhaseIndex < currentPhase.questions.length - 1) {
            interview.currentQuestionIndex++;
        } else {
            interview.currentQuestionIndex = 0;
            interview.currentPhaseIndex++;
        }
        saveInterviewToDB(interview);
    },
    advanceInterviewToNextPhase: async(interview: InterviewSettings) => {
        if (interview.currentPhaseIndex < interview.phases.length - 1) {
            interview.currentQuestionIndex = 0;
            interview.currentPhaseIndex++;
        } else {
            interview.currentQuestionIndex = -1;
            interview.currentPhaseIndex = -1;
        }
        saveInterviewToDB(interview);
    },  
}));

