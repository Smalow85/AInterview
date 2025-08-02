import { Answer } from "./interview-question";

export class ThemedConversationBot {
  public sessionId: string = '';
  public active: boolean = false;
  public theme: string = '';
  public learning_goals: string[] = [];
  public current_goal_index: number = 0;
  public answers: Answer[] = [];
  public finalFeedback: string = '';
  public candidateInfo: { name?: string; position?: string; } | null = null;


  public _initializeThemedConversationStructure(learning_goals: string[], theme: string): ThemedConversationBot {
    const newBot = new ThemedConversationBot();
    newBot.learning_goals = learning_goals;
    newBot.theme = theme;
    newBot.active = true;
    return newBot;
  }
}