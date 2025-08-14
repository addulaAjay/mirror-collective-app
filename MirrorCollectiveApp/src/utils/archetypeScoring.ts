export interface QuizAnswer {
  questionId: number;
  archetype: 'Seeker' | 'Guardian' | 'Flamebearer' | 'Weaver';
}

export interface QuestionOption {
  text?: string;
  label?: string;
  image?: string;
  archetype: Archetype;
}

export interface Question {
  id: number;
  question: string;
  options: QuestionOption[];
  type: 'text' | 'image';
  core: boolean;
}

export interface QuizConfig {
  archetypes: Archetype[];
  weights: {
    core: number;
    regular: number;
  };
  tieBreaker: {
    order: Archetype[];
  };
}

export interface ArchetypeData {
  id: string;
  name: string;
  title: string;
  description: string;
  imagePath: string;
}

export interface QuizData {
  config: QuizConfig;
  archetypes: Record<string, ArchetypeData>;
  questions: Question[];
}

export interface ArchetypeScores {
  Seeker: number;
  Guardian: number;
  Flamebearer: number;
  Weaver: number;
}

export interface UserAnswer {
  questionId: number;
  question: string;
  selectedOption: QuestionOption;
  optionIndex: number;
  archetype: Archetype;
}

export interface QuizResult {
  finalArchetype: Archetype;
  totalScores: ArchetypeScores;
  coreArchetypeCounts: ArchetypeScores;
  userAnswers: UserAnswer[];
  coreAnswers: UserAnswer[];
  timestamp: string;
  scoringDetails: {
    hadCoreArchetypeMatch: boolean;
    usedTieBreaker: boolean;
    tieBreakingRule?: string;
  };
}

export type Archetype = 'Seeker' | 'Guardian' | 'Flamebearer' | 'Weaver';

/**
 * Calculates complete quiz result with detailed information for database storage
 * @param userAnswers Array of user answers with full question/option details
 * @param quizData Complete quiz data from JSON (config + questions)
 * @returns Complete quiz result with all details for database persistence
 */
export function calculateQuizResult(
  userAnswers: UserAnswer[],
  quizData: QuizData,
): QuizResult {
  const { config, questions } = quizData;

  // Convert to legacy format for existing logic
  const answers: QuizAnswer[] = userAnswers.map(ua => ({
    questionId: ua.questionId,
    archetype: ua.archetype,
  }));

  // Step 1: Check if 2 or more core questions have the same archetype
  const coreQuestionIds = questions.filter(q => q.core).map(q => q.id);
  const coreUserAnswers = userAnswers.filter(answer =>
    coreQuestionIds.includes(answer.questionId),
  );
  const coreAnswers = answers.filter(answer =>
    coreQuestionIds.includes(answer.questionId),
  );
  const coreArchetypeCounts = getCoreArchetypeCounts(coreAnswers);

  let finalArchetype: Archetype;
  let hadCoreArchetypeMatch = false;
  let usedTieBreaker = false;
  let tieBreakingRule: string | undefined;

  // If any archetype appears 2+ times in core questions, return it immediately
  let coreMatch: Archetype | undefined;
  for (const archetype of config.archetypes) {
    if (coreArchetypeCounts[archetype] >= 2) {
      coreMatch = archetype;
      hadCoreArchetypeMatch = true;
      break;
    }
  }

  if (coreMatch) {
    finalArchetype = coreMatch;
  } else {
    // Step 2: Calculate total scores across all questions
    const totalScores = calculateTotalScores(answers, questions, config);

    // Step 3: Find archetype(s) with highest score
    const maxScore = Math.max(...Object.values(totalScores));
    const tiedArchetypes = (Object.keys(totalScores) as Archetype[]).filter(
      archetype => totalScores[archetype] === maxScore,
    );

    // If only one archetype has the highest score, return it
    if (tiedArchetypes.length === 1) {
      finalArchetype = tiedArchetypes[0];
    } else {
      // Step 4: Tie-breaker rules
      usedTieBreaker = true;
      const { archetype, rule } = resolveTieWithDetails(
        tiedArchetypes,
        coreAnswers,
        answers,
        config,
      );
      finalArchetype = archetype;
      tieBreakingRule = rule;
    }
  }

  return {
    finalArchetype,
    totalScores: calculateTotalScores(answers, questions, config),
    coreArchetypeCounts,
    userAnswers,
    coreAnswers: coreUserAnswers,
    timestamp: new Date().toISOString(),
    scoringDetails: {
      hadCoreArchetypeMatch,
      usedTieBreaker,
      tieBreakingRule,
    },
  };
}

/**
 * Legacy function for backward compatibility
 * @param answers Array of quiz answers with questionId and archetype
 * @param questions Array of question objects from questions.json
 * @returns The determined archetype based on scoring rules
 */
export function calculateArchetype(
  answers: QuizAnswer[],
  questions: Question[],
  config?: QuizConfig,
): Archetype {
  const quizConfig = config || {
    archetypes: ['Seeker', 'Guardian', 'Flamebearer', 'Weaver'],
    weights: { core: 2, regular: 1 },
    tieBreaker: { order: ['Seeker', 'Guardian', 'Flamebearer', 'Weaver'] },
  };

  // Step 1: Check if 2 or more core questions have the same archetype
  const coreQuestionIds = questions.filter(q => q.core).map(q => q.id);
  const coreAnswers = answers.filter(answer =>
    coreQuestionIds.includes(answer.questionId),
  );
  const coreArchetypeCounts = getCoreArchetypeCounts(coreAnswers);

  // If any archetype appears 2+ times in core questions, return it immediately
  for (const archetype of quizConfig.archetypes) {
    if (coreArchetypeCounts[archetype] >= 2) {
      return archetype;
    }
  }

  // Step 2: Calculate total scores across all 6 questions
  const totalScores = calculateTotalScores(answers, questions, quizConfig);

  // Step 3: Find archetype(s) with highest score
  const maxScore = Math.max(...Object.values(totalScores));
  const tiedArchetypes = (Object.keys(totalScores) as Archetype[]).filter(
    archetype => totalScores[archetype] === maxScore,
  );

  // If only one archetype has the highest score, return it
  if (tiedArchetypes.length === 1) {
    return tiedArchetypes[0];
  }

  // Step 4: Tie-breaker rules
  return resolveTie(tiedArchetypes, coreAnswers, answers, quizConfig);
}

/**
 * Counts how many times each archetype appears in core questions
 */
function getCoreArchetypeCounts(coreAnswers: QuizAnswer[]): ArchetypeScores {
  const counts: ArchetypeScores = {
    Seeker: 0,
    Guardian: 0,
    Flamebearer: 0,
    Weaver: 0,
  };

  coreAnswers.forEach(answer => {
    counts[answer.archetype]++;
  });

  return counts;
}

/**
 * Calculates total scores with core question weighting
 */
function calculateTotalScores(
  answers: QuizAnswer[],
  questions: Question[],
  config: QuizConfig,
): ArchetypeScores {
  const scores: ArchetypeScores = {
    Seeker: 0,
    Guardian: 0,
    Flamebearer: 0,
    Weaver: 0,
  };

  const coreQuestionIds = questions.filter(q => q.core).map(q => q.id);

  answers.forEach(answer => {
    const weight = coreQuestionIds.includes(answer.questionId)
      ? config.weights.core
      : config.weights.regular;

    scores[answer.archetype] += weight;
  });

  return scores;
}

/**
 * Resolves ties using the specified tie-breaker rules
 */
function resolveTie(
  tiedArchetypes: Archetype[],
  coreAnswers: QuizAnswer[],
  allAnswers: QuizAnswer[],
  config: QuizConfig,
): Archetype {
  const { archetype } = resolveTieWithDetails(
    tiedArchetypes,
    coreAnswers,
    allAnswers,
    config,
  );
  return archetype;
}

/**
 * Resolves ties with detailed information about which rule was used
 */
function resolveTieWithDetails(
  tiedArchetypes: Archetype[],
  coreAnswers: QuizAnswer[],
  allAnswers: QuizAnswer[],
  config: QuizConfig,
): { archetype: Archetype; rule: string } {
  // Tie-breaker 1: Check which tied archetype appears in more core questions
  const coreArchetypeCounts = getCoreArchetypeCounts(coreAnswers);
  const maxCoreCount = Math.max(
    ...tiedArchetypes.map(archetype => coreArchetypeCounts[archetype]),
  );
  const coreWinners = tiedArchetypes.filter(
    archetype => coreArchetypeCounts[archetype] === maxCoreCount,
  );

  if (coreWinners.length === 1) {
    return {
      archetype: coreWinners[0],
      rule: `Most core questions (${maxCoreCount} core answers)`,
    };
  }

  // Tie-breaker 2: Check Q1 answer among remaining tied archetypes
  const q1Answer = allAnswers.find(answer => answer.questionId === 1);
  if (q1Answer && coreWinners.includes(q1Answer.archetype)) {
    return {
      archetype: q1Answer.archetype,
      rule: 'Question 1 preference',
    };
  }

  // Tie-breaker 3: Default to first archetype in order
  for (const archetype of config.tieBreaker.order) {
    if (coreWinners.includes(archetype)) {
      return {
        archetype,
        rule: `Default ordering (${archetype} comes first)`,
      };
    }
  }

  // Fallback (should never reach here with valid input)
  return {
    archetype: tiedArchetypes[0],
    rule: 'Fallback to first tied archetype',
  };
}

/**
 * Gets detailed scoring breakdown for debugging/testing
 */
export function getScoreBreakdown(
  answers: QuizAnswer[],
  questions: Question[],
  config: QuizConfig,
) {
  const totalScores = calculateTotalScores(answers, questions, config);
  const coreQuestionIds = questions.filter(q => q.core).map(q => q.id);
  const coreAnswers = answers.filter(answer =>
    coreQuestionIds.includes(answer.questionId),
  );
  const coreArchetypeCounts = getCoreArchetypeCounts(coreAnswers);

  return {
    totalScores,
    coreArchetypeCounts,
    coreAnswers: coreAnswers.map(answer => ({
      questionId: answer.questionId,
      archetype: answer.archetype,
    })),
    finalArchetype: calculateArchetype(answers, questions, config),
  };
}

/**
 * Helper function to create UserAnswer objects from quiz responses
 */
export function createUserAnswer(
  questionId: number,
  question: string,
  selectedOption: QuestionOption,
  optionIndex: number,
): UserAnswer {
  return {
    questionId,
    question,
    selectedOption,
    optionIndex,
    archetype: selectedOption.archetype,
  };
}
