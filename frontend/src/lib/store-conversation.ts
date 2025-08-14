// frontend/live-api-web-console-main/src/lib/store-interview-question.ts

import { create } from "zustand";
import { ThemedConversationSettings } from "../types/settings";
import { saveConversationToDB, fetchConversationBySessionId } from "./storage/conversation-storage";

interface ConversationQuestionsState {
    themedConversation: ThemedConversationSettings;
    patchConversation: (partialSettings: Partial<ThemedConversationSettings>) => void;
    updateConversation: (conversationSettings: ThemedConversationSettings) => void;
    fetchQuestions: (sessionId: string, theme: string) => Promise<string[]>;
    getConversationBySessionId: (sessionId: string) => Promise<ThemedConversationSettings>;
    getCurrentGoal: (conversation: ThemedConversationSettings) => string;
    advanceToNextQuestion: (conversation: ThemedConversationSettings) => void;
};

export const getConversation = async (sessionId: string): Promise<ThemedConversationSettings> => {
  await useThemedConversationStore.getState().getConversationBySessionId(sessionId); // Wait for settings to load
  return useThemedConversationStore.getState().themedConversation;
}; 

export const updateConversation = async (conversation: ThemedConversationSettings): Promise<ThemedConversationSettings> => {
  await useThemedConversationStore.getState().updateConversation(conversation); // Wait for settings to load
  return useThemedConversationStore.getState().themedConversation;
}; 

const defaultConversation: ThemedConversationSettings = {
    activeSessionId: '',
    learningGoals: [],
    answers: [],
    currentGoalIndex: 0,
    learningGoalScore: [],
    theme: '',
    conversationLoaded: false,
    finalFeedback: ''
};

export const useThemedConversationStore = create<ConversationQuestionsState>((set) => ({
    themedConversation: defaultConversation,
    conversationLoaded: true,
    fetchQuestions: async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/themed-conversation/themed-conversation-plan/${sessionId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: string[] = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching questions:", error);
            return [];
        }
    },
    getConversationBySessionId: async (sessionId: string) => {
        return fetchConversationBySessionId(sessionId);
    },
    patchConversation: (partialSettings: Partial<ThemedConversationSettings>) => {
        console.log(partialSettings);
        set((state) => {
            const themedConversation = { ...state.themedConversation, ...partialSettings };
            saveConversationToDB(themedConversation);
            return { themedConversation: themedConversation };
        });
    },
    updateConversation: (conversationSettings: ThemedConversationSettings) => {
        saveConversationToDB(conversationSettings);
        set((state) => ({
            themedConversation: conversationSettings
        }));
    },
    getCurrentGoal: (themedConversation: ThemedConversationSettings) => {
        return themedConversation.learningGoals[themedConversation.currentGoalIndex];
    },
    advanceToNextQuestion: (themedConversation: ThemedConversationSettings) => {
        if (themedConversation.currentGoalIndex < themedConversation.learningGoals.length - 1) {
            themedConversation.currentGoalIndex++;
        }
    },
    generateFinalReport: (themedConversation: ThemedConversationSettings) => {
        const report: any = {
            total_questions_asked: themedConversation.answers.length,
            answers_summary: themedConversation.answers.map((answer) => ({
                question_id: answer.question_id,
                evaluation_score: answer.evaluation_score,
                notes: answer.notes,
            })),
            overall_score: 0,
        };

        const totalScore = themedConversation.answers.reduce((sum, ans) => sum + (ans.evaluation_score || 0), 0);
        report.overall_score = themedConversation.answers.length > 0 ? totalScore / themedConversation.answers.length : 0;

        return report;
    }
}));