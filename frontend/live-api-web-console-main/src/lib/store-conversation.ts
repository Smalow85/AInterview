// frontend/live-api-web-console-main/src/lib/store-interview-question.ts

import { create } from "zustand";
import { LeariningGoal } from "../types/interview-question";
import { ThemedConversationSettings } from "../types/settings";

interface ConversationQuestionsState {
    themedConversation: ThemedConversationSettings;
    updateConversation: (partialSettings: Partial<ThemedConversationSettings>) => void; 
    fetchQuestions: (sessionId: string, theme: string) => Promise<LeariningGoal[]>;
}

const defaultConversation: ThemedConversationSettings = {
    learningGoals: [],
    theme: '',
    conversationLoaded: false
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
                const data: LeariningGoal[] = await response.json();
                return data;
        } catch (error) {
            console.error("Error fetching questions:", error);
            return [];
        }
    },
    updateConversation: (partialSettings: Partial<ThemedConversationSettings>) => { 
        console.log(partialSettings);
        set((state) => ({
          themedConversation: { ...state.themedConversation, ...partialSettings }, // Merge settings
        }));
      },
}));