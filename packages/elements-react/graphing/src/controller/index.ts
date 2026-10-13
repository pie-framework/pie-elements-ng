import debug from 'debug';

import { cloneDeep, isEmpty, uniqWith } from '@pie-element/shared-lodash';
import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import { equalMarks, equalPointWithLabel, sortedAnswers } from './utils.js';

import { partialScoring } from '@pie-element/shared-controller-utils';
import type {
  Answer,
  Arrows,
  Graph,
  GraphingConfiguration,
  GraphingModel,
  GraphingSession,
  GraphingTool,
  Mark,
  MarkType,
} from '../types.js';

const log = debug('@pie-element:graphing:controller');

type Correctness = 'correct' | 'incorrect' | 'missing';

/** A session mark scored against an answer. */
type CorrectedMark = Mark & {
  correctness: Correctness;
  /** Whether the mark's label matches the answer mark's label */
  correctnesslabel?: 'correct' | 'incorrect';
  /** The answer mark's label */
  correctlabel?: string;
};

/** An answer as scoring reads it; the placeholder `initializeGraphMap()` holds no marks. */
type PossibleAnswer = Partial<Answer>;

type BestAnswer = {
  bestScore: number;
  bestScoreAnswerKey: string | null;
  answersCorrected: CorrectedMark[];
  foundOneSolution: boolean;
};

/** The model the delivery view receives. */
type GraphingViewModel = Omit<
  GraphingModel,
  'arrows' | 'defaultTool' | 'graph' | 'prompt' | 'rationale' | 'teacherInstructions'
> & {
  arrows?: Arrows;
  defaultTool: GraphingTool | '';
  disabled: boolean;
  prompt?: string | null;
  rationale?: string | null;
  size?: Graph;
  showKeyLegend: boolean;
  showToggle: boolean;
  teacherInstructions?: string | null;
  /** Session marks; in evaluate mode with a correct answer, each carries `correctness` */
  answersCorrected?: Mark[];
  correctResponse?: Mark[];
};

/** Errors `validate()` reports; `correctAnswerErrors` is keyed by answer key. */
export type GraphingValidationErrors = {
  toolbarToolsError?: string;
  teacherInstructions?: string;
  prompt?: string;
  rationale?: string;
  correctAnswerErrors?: Record<string, string>;
};

const initializeGraphMap = (): PossibleAnswer & Record<MarkType, Mark[]> => ({
  point: [],
  segment: [],
  line: [],
  ray: [],
  vector: [],
  polygon: [],
  circle: [],
  sine: [],
  parabola: [],
  absolute: [],
  exponential: [],
});

const graphObjectsOrder: Record<Correctness, number> = {
  incorrect: 0,
  correct: 1,
  missing: 2,
};

export const compareMarks = (mark1: Mark | undefined, mark2: Mark | undefined) => {
  // marks can be compared with equalMarks[type] function only if they have the same type;
  // if type is different, they are clearly not equal
  return !!(
    mark1 &&
    mark2 &&
    mark1.type === mark2.type &&
    equalMarks[mark1.type] &&
    equalMarks[mark1.type](mark1, mark2)
  );
};

export const comparLabelMarks = (mark1: Mark, mark2: Mark) => {
  return mark1.label === mark2.label ? 'correct' : 'incorrect';
};

export const getAnswerCorrected = ({
  sessionAnswers: sessionAnswersInput,
  marks: correctAnswersInput,
  withPointLabel = false,
}: {
  sessionAnswers?: Mark[];
  marks?: Mark[];
  withPointLabel?: boolean;
}): CorrectedMark[] => {
  const sessionAnswers = sessionAnswersInput || [];
  const correctAnswers = correctAnswersInput || [];

  const rez = cloneDeep(sessionAnswers).reduce<CorrectedMark[]>((correctedAnswer, sessionMark) => {
    const answerIsCorrect = correctAnswers.find((mark) => compareMarks(sessionMark, mark));

    // For scoring points, check if both position AND label match
    const isCorrectForScoring = answerIsCorrect && sessionMark.type === 'point' && withPointLabel 
      ? equalPointWithLabel(sessionMark, answerIsCorrect)
      : !!answerIsCorrect;

    const correctness: Correctness = isCorrectForScoring ? 'correct' : 'incorrect';
    const answer: CorrectedMark = Object.assign(sessionMark, { correctness });
    if (answerIsCorrect) {
      answer.correctnesslabel = comparLabelMarks(answer, answerIsCorrect);
      answer.correctlabel = answerIsCorrect.label ? answerIsCorrect.label : '';
      answer.label = answer.label ? answer.label : '';
    }
    return [...correctedAnswer, answer];
  }, []);

  // add missing objects from correct answer
  const missingAnswers = cloneDeep(correctAnswers).reduce<CorrectedMark[]>((correctedAnswer, answer) => {
    const answerIndex = sessionAnswers.find((mark) => compareMarks(answer, mark));

    if (!answerIndex) {
      // means that corrected answer is missing from session, so we mark it as missing object
      return [...correctedAnswer, { ...answer, correctness: 'missing' }];
    }

    return correctedAnswer;
  }, []);

  return [...rez, ...missingAnswers];
};

const getPartialScoring = ({
  scoringType,
  env,
}: {
  scoringType: GraphingModel['scoringType'];
  env: Partial<PieEnvironment> | undefined;
}) => {
  let pS: boolean | undefined;

  // if scoringType is undefined, partialScoring should be considered undefined (not set)
  // because partialScoring.enabled is using that information
  // if it has a value, we check if it is partial scoring or dichotomous
  if (scoringType) {
    pS = scoringType === 'partial scoring';
  }

  return partialScoring.enabled({ partialScoring: pS }, env);
};

export const getBestAnswer = (
  question: GraphingModel | undefined,
  session: GraphingSession | undefined,
  env: Partial<PieEnvironment> = {},
): BestAnswer => {
  // questionAnswers contains all possible answers (correct response and alternates);
  const questionAnswers: Record<string, Answer> = question?.answers ?? {};
  const scoringType = question?.scoringType;
  const { answer: sessionAnswer } = session || {};

  // filter the incomplete objects
  Object.entries(questionAnswers || {}).forEach(
    ([key, value]) =>
      (questionAnswers[key] = { ...value, marks: value?.marks.filter((mark) => !mark.building) }),
  );

  // initialize answer if no values
  let answer = sessionAnswer || [];

  //filter the incomplete objects for student response - Fix for SC-33160
  answer = answer.filter((mark) => !mark.building);

  let questionPossibleAnswers: Record<string, PossibleAnswer | undefined>;

  // initialize one possible answer if no values
  if (isEmpty(questionAnswers)) {
    questionPossibleAnswers = { correctAnswer: initializeGraphMap() };
  } else {
    questionPossibleAnswers = {
      correctAnswer: questionAnswers.correctAnswer,
      ...sortedAnswers<PossibleAnswer>(questionAnswers),
    };
  }

  const partialScoringEnabled = getPartialScoring({ scoringType, env });

  // student's answers without DUPLICATES
  const sessionAnswers = uniqWith(answer, compareMarks);
  // array of possible answers entries
  const possibleAnswers = Object.entries(questionPossibleAnswers);

  return possibleAnswers.reduce<BestAnswer>(
    (acc, entry) => {
      // iterating each possible answer (main + alternates)
      const possibleAnswerKey = entry[0];
      const possibleAnswer = entry[1] || {};
      const { marks } = possibleAnswer;

      if (!marks || !marks.length) {
        return acc;
      }

      // returns array of marks, each having 'correctness' property
      const correctedAnswer = getAnswerCorrected({ sessionAnswers, marks });
      const correctedAnswerWithLabels = getAnswerCorrected({ sessionAnswers, marks, withPointLabel: true });
      const correctMarks = correctedAnswerWithLabels.filter((answer) => answer.correctness === 'correct');
      // filter out missing objects because they do not affect the calculation of the score
      // only correct and incorrect are needed
      const scoredCorrectedAnswer = correctedAnswerWithLabels.filter((answer) => answer.correctness !== 'missing');

      const maxScore = marks.length;
      let score = correctMarks.length;

      // if extra placements
      if (scoredCorrectedAnswer.length > maxScore) {
        score -= scoredCorrectedAnswer.length - maxScore;
      }

      if (score < 0) {
        score = 0;
      }

      if (score / maxScore > acc.bestScore || !acc.foundOneSolution) {
        if (partialScoringEnabled) {
          acc.bestScore = parseFloat((score / maxScore).toFixed(2));
        } else {
          acc.bestScore = Math.floor(score / maxScore);
        }

        acc.bestScoreAnswerKey = possibleAnswerKey;
        acc.answersCorrected = correctedAnswer;
        acc.foundOneSolution = true;
      }

      return acc;
    },
    {
      bestScore: 0,
      bestScoreAnswerKey: null,
      // initially we just suppose all the answers are incorrect
      answersCorrected: cloneDeep(sessionAnswers).map((answer): CorrectedMark => ({ ...answer, correctness: 'incorrect' })),
      foundOneSolution: false,
    },
  );
};

export const normalize = (question: GraphingModel): GraphingModel => ({ ...defaults, ...question });

export function model(
  question: GraphingModel,
  session: GraphingSession | null | undefined,
  env: PieEnvironment,
): Promise<GraphingViewModel> {
  return new Promise((resolve) => {
    const normalizedQuestion = normalize(question);

    // added a sanity check for session for environments where it is not passed initially (ex. pie-website)
    if (session === undefined || session === null) {
      session = {};
    }
    // console.log('normalizedQuestion', normalizedQuestion);
    const { defaultTool, extraCSSRules, prompt, promptEnabled, graph, answers, toolbarTools, ...questionProps } =
      normalizedQuestion;
    let { arrows } = normalizedQuestion;
    const mode = env?.mode;
    const role = env?.role;

    // This is used for offering support for old models which have the property arrows: boolean
    // Same thing is set in authoring : packages/graphing/configure/src/configure.jsx - componentDidMount
    if (typeof arrows === 'boolean') {
      if (arrows) {
        arrows = {
          left: true,
          right: true,
          up: true,
          down: true,
        };
      } else {
        arrows = {
          left: false,
          right: false,
          up: false,
          down: false,
        };
      }
    }

    // added support for models without defaultTool defined; also used in packages/graphing/configure/src/index.js
    const toolbarToolsNoLabel = (toolbarTools || []).filter((tool) => tool !== 'label');
    const normalizedDefaultTool = defaultTool || (toolbarToolsNoLabel.length && toolbarToolsNoLabel[0]) || '';

    const base: GraphingViewModel = {
      ...questionProps,
      answers,
      arrows,
      defaultTool: normalizedDefaultTool,
      disabled: env.mode !== 'gather',
      prompt: promptEnabled ? prompt : null,
      rationale: null,
      size: graph,
      showKeyLegend: env.mode === 'evaluate',
      showToggle:
        env.mode === 'evaluate' &&
        !isEmpty(answers) &&
        answers.correctAnswer &&
        answers.correctAnswer.marks &&
        !isEmpty(answers.correctAnswer.marks),
      teacherInstructions: null,
      toolbarTools,
      extraCSSRules,
    };

    if (role === 'instructor' && (mode === 'view' || mode === 'evaluate')) {
      const { rationale, rationaleEnabled, teacherInstructions, teacherInstructionsEnabled } = normalizedQuestion;

      base.rationale = rationaleEnabled ? rationale : null;
      base.teacherInstructions = teacherInstructionsEnabled ? teacherInstructions : null;
    }

    if (mode === 'evaluate') {
      if (
        !isEmpty(answers) &&
        answers.correctAnswer &&
        answers.correctAnswer.marks &&
        !isEmpty(answers.correctAnswer.marks)
      ) {
        const { answersCorrected, bestScoreAnswerKey, bestScore } = getBestAnswer(normalizedQuestion, session, env);
        // array of marks from session with 'correctness' property set
        base.answersCorrected = answersCorrected.sort(
          (a, b) => graphObjectsOrder[a.correctness] - graphObjectsOrder[b.correctness],
        );
        base.correctResponse = bestScoreAnswerKey ? (answers[bestScoreAnswerKey] || {}).marks : [];
        base.showToggle = base.showToggle && bestScore !== 1;
      } else {
        base.answersCorrected = (session && session.answer) || [];
        base.correctResponse = [];
      }
    }

    log('base: ', base);
    resolve(base);
  });
}

  /**
 * Generates detailed trace log for scoring evaluation
 * @param {Object} model - the question model
 * @param {Object} session - the student session
 * @param {Object} env - the environment
 * @returns {Array} traceLog - array of trace messages
 */
export const getLogTrace = (
  question: GraphingModel,
  session: GraphingSession | undefined,
  env: Partial<PieEnvironment> | undefined,
) => {
  const traceLog: string[] = [];
  const answers: Record<string, Answer> = question?.answers ?? {};
  const scoringType = question?.scoringType;
  const studentMarks = (session && session.answer) || [];

  if (!studentMarks.length) {
    return ['Student did not interact with the graph.'];
  }

  traceLog.push(`Student added ${studentMarks.length} object(s) to the graph.`);

  const partialScoringEnabled = getPartialScoring({ scoringType, env });

  const {
    answersCorrected,
    bestScore,
    bestScoreAnswerKey,
  } = getBestAnswer(question, session, env);

  const correctResponse =
    bestScoreAnswerKey && answers[bestScoreAnswerKey]
      ? answers[bestScoreAnswerKey].marks || []
      : [];

  let correctCount = 0;
  let incorrectCount = 0;
  let missingCount = 0;

  for (let i = 0; i < answersCorrected.length; i++) {
    const c = answersCorrected[i].correctness;
    if (c === 'correct') correctCount++;
    else if (c === 'incorrect') incorrectCount++;
    else if (c === 'missing') missingCount++;
  }

  if (correctCount > 0) {
    traceLog.push(`Correct objects: ${correctCount}.`);
  }

  if (incorrectCount > 0) {
    traceLog.push(`Incorrect objects: ${incorrectCount}.`);
  }

  if (missingCount > 0) {
    traceLog.push(`Missing required objects: ${missingCount}.`);
  }

  answersCorrected.forEach((mark, index) => {
    const objectType = mark.type || 'graph object';
    const objectLabel = mark.label ? `'${mark.label}'` : '';
    const objectIndex = `with index ${index + 1}`;

    if (mark.correctness === 'correct') {
      traceLog.push(
        `${objectType.charAt(0).toUpperCase() + objectType.slice(1)} ${objectLabel || objectIndex} is correct.`
      );
    }

    if (mark.correctness === 'incorrect') {
      traceLog.push(
        `${objectType.charAt(0).toUpperCase() + objectType.slice(1)} ${objectLabel || objectIndex} does not match the expected ${objectType}.`
      );
    }

    if (mark.correctness === 'missing') {
      traceLog.push(`Expected ${objectType} ${objectLabel || objectIndex} was not plotted by the student.`);
    }
  });

  if (studentMarks.length > correctResponse.length) {
    const extra = studentMarks.length - correctResponse.length;
    traceLog.push(`${extra} extra object(s) were plotted and are penalized in scoring.`);
  }

  if (partialScoringEnabled) {
    traceLog.push('Score calculated using partial scoring.');
  } else {
    traceLog.push('Score calculated using all-or-nothing scoring.');
  }

  traceLog.push(`Final score: ${bestScore}.`);

  return traceLog;
};


export function outcome(
  question: GraphingModel,
  session: GraphingSession | undefined,
  env: Partial<PieEnvironment> = {},
) {
  return new Promise<{ score: number; empty: boolean; logTrace: string[] }>((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true, logTrace: ['Student did not interact with the graph.'] });
    }

    if (
      env.mode !== 'evaluate' ||
      isEmpty(question.answers) ||
      (question.answers && question.answers.correctAnswer && isEmpty(question.answers.correctAnswer.marks))
    ) {
      resolve({ score: 0, empty: true, logTrace: ['Student did not interact with the graph.'] });
    }

    const { bestScore } = getBestAnswer(question, session, env);

    resolve({ score: bestScore, empty: false, logTrace: getLogTrace(question, session, env) });
  });
}

export const createCorrectResponseSession = (question: GraphingModel, env: PieEnvironment) => {
  return new Promise<GraphingSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { answers } = question || {};
      let marks: Mark[] = [];

      if (answers && Object.values(answers)) {
        const correctAnswer = answers.correctAnswer || Object.values(answers)[0] || {};
        marks = correctAnswer.marks || [];
      }

      resolve({
        answer: marks,
        id: '1',
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<GraphingModel> = {},
  config: GraphingConfiguration = {},
): GraphingValidationErrors => {
  const { answers, toolbarTools } = model;
  const errors: GraphingValidationErrors = {};
  const correctAnswerErrors: Record<string, string> = {};
  const toolbarToolsNoLabel = (toolbarTools || []).filter((tool) => tool !== 'label');

  if (!toolbarToolsNoLabel.length) {
    errors.toolbarToolsError = 'There should be at least 1 tool defined.';
  }

  (['teacherInstructions', 'prompt', 'rationale'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  Object.entries(answers || {}).forEach(([key, value]) => {
    if (!value.marks.length) {
      correctAnswerErrors[key] = 'At least 1 graph object should be defined.';
    }

    // check if all graph objects are correctly defined with respect to root, edge and from, to
    if (value.marks.length > 0) {
      value.marks.forEach((mark) => {
        if (mark.building) {
          correctAnswerErrors[key] = 'At least 1 graph object is not correctly defined.';
        }
      });
    }
  });

  if (!isEmpty(correctAnswerErrors)) {
    errors.correctAnswerErrors = correctAnswerErrors;
  }

  return errors;
};
