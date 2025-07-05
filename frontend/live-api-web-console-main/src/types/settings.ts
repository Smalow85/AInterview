import { InterviewPhase } from "./interview-question";

export interface UserSettings {
  id: number;
  firstName?: string;
  lastName?: string;
  activeSessionId: string;
  email?: string;
  systemInstruction?: string;
  sessionActive?: boolean;
  resumptionToken?: string;
  sessionType?: string;
}

export interface ThemedConversationSettings {
  learningGoals: string[];
  theme: string;
  conversationLoaded: boolean
}

export interface InterviewSettings {
  phases: InterviewPhase[];
  position: string;
  interviewLoaded: boolean
}

export interface EditableUserSettings {
    firstName?: string;
    lastName?: string;
    email?: string;
    systemInstruction?: string;
}