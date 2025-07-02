import { Answer, InterviewPhase, Question } from "./interview-question";
import { InterviewSettings } from "./settings";

export class TechnicalInterviewBot {
  public active: boolean = false;
  public position: string = 'Python Developer';
  public phases: InterviewPhase[] = [];
  public current_phase_index: number = 0;
  public current_question_index: number = 0;
  public answers: Answer[] = [];
  public questionSent: boolean = false;
  public candidateInfo: { name?: string; position?: string; sessionId?: string } | null = null;


  public _initializeInterviewStructure(interview : InterviewSettings) {
    this.phases = interview.phases;
    this.position = interview.position;
    this.active = true;
  }

  public get current_phase(): string {
    return this.phases[this.current_phase_index]?.name || 'Unknown';
  }

  public get_current_question(): Question | null {
    if (!this.phases) {
        return null;
    }
    if (this.current_phase_index >= this.phases.length) {
      return null;
    }
    const currentPhase = this.phases[this.current_phase_index];
    if (this.current_question_index >= currentPhase.questions.length) {
      return null;
    }
    return currentPhase.questions[this.current_question_index];
  }

  public advance_to_next_question(): void {
    const currentPhase = this.phases[this.current_phase_index];
    if (this.current_question_index < currentPhase.questions.length - 1) {
      this.current_question_index++;
    } else {
      this.current_question_index = 0;
      this.current_phase_index++;
    }
  }

  public generate_final_report(): any {
    const report: any = {
      position: this.position,
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