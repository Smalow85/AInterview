import { Answer } from "./interview-question";

export class ThemedConversationBot {
  public active: boolean = false;
  public theme: string = '';
  public learning_goals: string[] = [];
  public current_goal_index: number = 0;
  public answers: Answer[] = [];
  public questionSent: boolean = false;
  public candidateInfo: { name?: string; position?: string; sessionId?: string } | null = null;


  public _initializeThemedConversationStructure(learning_goals : string[], theme: string) {
    this.learning_goals = learning_goals;
    this.theme = theme;
    this.active = true;
  }

  public get_current_goal(): string | null {
    return this.learning_goals[this.current_goal_index];
  }

  public advance_to_next_question(): void {
    if (this.current_goal_index < this.learning_goals.length - 1) {
      this.current_goal_index++;
    }
  }

  public generate_final_report(): any {
    const report: any = {
      total_questions_asked: this.answers.length,
      answers_summary: this.answers.map((answer) => ({
        question_id: answer.question_id,
        evaluation_score: answer.evaluation_score,
        notes: answer.notes,
      })),
      overall_score: 0,
    };

    const totalScore = this.answers.reduce((sum, ans) => sum + (ans.evaluation_score || 0), 0);
    report.overall_score = this.answers.length > 0 ? totalScore / this.answers.length : 0;

    return report;
  }
}