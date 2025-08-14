export interface InterviewQuestion {
    id: number;
    sessionId: string;
    question: string;
    asked: boolean;
}

export enum QuestionType {
  Behavioral = 'Behavioral',
  Technical = 'Technical',
  Algorithmic = 'Algorithmic',
  SystemDesign = 'SystemDesign',
}

export enum DifficultyLevel {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  expectedKeywords: string[];
  evaluationCriteria: string[];
}

export interface Answer {
  question_id: number;
  answer_text: string;
  timestamp: number;
  evaluation_score?: number;
  notes?: string;
}

export interface InterviewPhase {
  name: string;
  duration_minutes: number;
  questions: Question[];
}

export interface AnalysisResult {
  status: 'interview_complete' | 'continue' | 'conversation_complete';
  analysis: {
    found_keywords: string[];
    completeness_score: number;
    needs_follow_up: boolean;
    suggested_follow_ups: string[];
  };
}