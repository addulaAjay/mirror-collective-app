export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  termsAcceptedAt?: string;
}

export interface VerifyEmailData {
  email: string;
  verificationCode: string;
  anonymousId?: string;  // For linking anonymous quiz data
  termsAcceptedAt?: string;
}

export interface ResetPasswordData {
  email: string;
  resetCode: string;
  newPassword: string;
}

// MirrorGPT Quiz Types
export interface QuizAnswer {
  questionId: number;
  question: string;
  answer: string | { label: string; image: string };
  answeredAt: string;
  type: 'text' | 'image';
}

export interface QuizOption {
  text?: string;
  label?: string;
  image?: string;
  archetype: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  type: 'text' | 'image';
  core: boolean;
}

export interface ArchetypeResult {
  id: string;
  name: string;
  title: string;
}

export interface QuizSubmissionRequest {
  quizType?: string; // Quiz identifier (archetype, career_path, etc.)
  answers: QuizAnswer[];
  completedAt: string;
  quizVersion?: string;
  anonymousId?: string; // For unauthenticated submissions
}

export interface QuizSubmissionResponse {
  quiz_type: string; // Quiz identifier
  user_id: string;
  final_archetype: string; // Backend calculated
  assignment_reason: string; // core_override | highest_score | tie_break_*
  total_scores: Record<string, number>; // Scores for all archetypes
  archetype_details: {
    id: string;
    name: string;
    title: string;
    description: string;
    imagePath: string;
  };
  quiz_completed_at: string;
  quiz_version: string;
  profile_created: boolean;
  answers_stored: boolean;
}

// Cached quiz with backend-calculated result
export interface CachedQuizResult extends QuizSubmissionRequest {
  backendResult?: {
    quiz_type: string; // Quiz identifier
    final_archetype: string;
    assignment_reason: string;
    total_scores: Record<string, number>;
    archetype_details: {
      id: string;
      name: string;
      title: string;
      description: string;
      imagePath: string;
    };
  };
}

// MirrorGPT Session Types
export interface SessionGreetingResponse {
  greeting_message: string;
  session_id: string;
  timestamp: string;
  user_archetype: string;
  archetype_confidence: number;
}

// MirrorGPT Chat Types
export interface ChatRequest {
  message: string;
  session_id: string;
  conversation_id?: string | null;
  include_archetype_analysis?: boolean;
  use_enhanced_response?: boolean;
}

export interface ArchetypeAnalysis {
  signal_1_emotional_resonance: {
    dominant_emotion: string;
    valence: number;
    arousal: number;
  };
  signal_2_symbolic_language: {
    extracted_symbols: string[];
  };
  signal_3_archetype_blend: {
    primary: string;
    secondary: string;
    confidence: number;
  };
}

export interface ChangeDetection {
  archetype_shift_detected: boolean;
  stability_score: number;
}

export interface ConfidenceBreakdown {
  overall: number;
  emotional: number;
  symbolic: number;
  archetype: number;
}

export interface SessionMetadata {
  conversation_id: string;
  session_id: string;
  message_count: number;
}

export interface ChatResponse {
  message_id: string;
  response: string;
  archetype_analysis: ArchetypeAnalysis;
  change_detection: ChangeDetection;
  suggested_practice: string;
  confidence_breakdown: ConfidenceBreakdown;
  session_metadata: SessionMetadata;
}
