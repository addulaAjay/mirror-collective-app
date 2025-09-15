export interface QuizAnswer {
  questionId: number | string;
  question: string;
  optionIndex: number;
  archetype?: string;
  selectedOption?: {
    text?: string;
    image?: string;
    archetype?: string;
  };
}

export interface QuizResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QuizRequest {
  userId: string;
  answers: QuizAnswer[];
}
