import { Answer, InterviewPhase } from "./interview-question";

export interface UserSettings {
  id: number;
  firstName?: string;
  lastName?: string;
  language: string;
  activeSessionId: string;
  email?: string;
  systemInstruction?: string;
  sessionActive?: boolean;
  resumptionToken?: string;
  sessionType?: string;
  theme?: string;
}

export interface ThemedConversationSettings {
  activeSessionId: string;
  learningGoals: string[];
  answers: Answer[];
  learningGoalFeedbacks: string[]; 
  currentGoalIndex: number;
  theme: string;
  conversationLoaded: boolean;
  finalFeedback: string;
}

export interface InterviewSettings {
  activeSessionId: string;
  phases: InterviewPhase[];
  position: string;
  interviewLoaded: boolean
}

export interface EditableUserSettings {
  firstName?: string;
  lastName?: string;
  email?: string;
  language?: string;
  systemInstruction?: string;
  theme?: string;
}