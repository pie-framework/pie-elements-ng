import debug from 'debug';
import { cloneDeep, isEmpty, uniqWith } from '@pie-element/shared-lodash';
import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import { equalLinePosition, equalMarks, equalPolygon, keyRegionSections, sortedAnswers, removeInvalidAnswers } from './utils.js';
import type {
  Answer,
  Arrows,
  Graph,
  GraphingSolutionSetModel,
  GraphingSolutionSetSession,
  GssLineData,
  Mark,
} from '../types.js';

const log = debug('@pie-element:graphing-solution-set:controller');

type Correctness = 'correct' | 'incorrect' | 'missing';

/** A session mark scored against an answer. */
type CorrectedMark = Mark & {
  correctness: Correctness;
  /**
   * Whether a line's solid or dashed style is right, apart from its position. Set on a line the key has in that
   * place; a line in the right place but the wrong style is `incorrect` for scoring, with `lineStyle: 'incorrect'`; delivery draws it as
   * correctly placed and shows the style verdict apart.
   */
  lineStyle?: 'correct' | 'incorrect';
  /** Whether the line lies on a key line, so only its style can be wrong; a line elsewhere is judged by its slot. */
  onKeyLine?: boolean;
  /** The style the key gives the line, when `lineStyle` is set. */
  expectedFill?: Mark['fill'];
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
type GraphingSolutionSetViewModel = Omit<
  GraphingSolutionSetModel,
  'answers' | 'arrows' | 'graph' | 'gssLineData' | 'prompt' | 'rationale' | 'teacherInstructions'
> & {
  /** Only in evaluate mode or for the instructor: delivery reads `correctResponse` instead */
  answers?: GraphingSolutionSetModel['answers'];
  /** The full line data only alongside `answers`; otherwise just the line count */
  gssLineData?: GssLineData | Pick<GssLineData, 'numberOfLines'>;
  arrows?: Arrows;
  defaultTool: 'line';
  disabled: boolean;
  prompt?: string | null;
  rationale?: string | null;
  size?: Graph;
  showToggle: boolean;
  /** Evaluate mode explains each mark's colour and icon in a key */
  showKeyLegend: boolean;
  teacherInstructions?: string | null;
  /** Not read by the delivery view, which offers the line and polygon tools. */
  toolbarTools?: unknown;
  /** Session marks; in evaluate mode with a correct answer, each carries `correctness` */
  answersCorrected?: (Mark & { correctness?: Correctness; lineStyle?: 'correct' | 'incorrect'; expectedFill?: Mark['fill']; onKeyLine?: boolean })[];
  correctResponse?: Mark[];
};

/** Errors `validate()` reports; `correctAnswerErrors` is keyed by answer key. */
export type GraphingSolutionSetValidationErrors = {
  correctAnswerErrors?: Record<string, string>;
};

const initializeGraphMap = (): PossibleAnswer & { line: Mark[] } => ({
  line: [],
});

/*
 * Function to compare two marks
 * @param {Object} mark1 - first mark
 * @param {Object} mark2 - second mark
 * @param {Map} regions - today's sections each key region stands for, from keyRegionSections
 * */
export const compareMarks = (mark1: Mark | undefined, mark2: Mark | undefined, regions?: ReadonlyMap<Mark, Mark[]>) => {
  // marks can be compared with equalMarks[type] function only if they have the same type;
  // if type is different, they are clearly not equal
  return !!(
    mark1 &&
    mark2 &&
    mark1.type === mark2.type &&
    equalMarks[mark1.type] &&
    (equalMarks[mark1.type](mark1, mark2) || !!regions?.get(mark2)?.some((section) => equalPolygon(mark1, section)))
  );
};

/*
 * Function to get the corrected answer
 * @param {Object} sessionAnswers - array of marks from session
 * @param {Object} marks - array of marks from correct answer
 * */
export const getAnswerCorrected = ({
  sessionAnswers: sessionAnswersInput,
  marks: correctAnswersInput,
  regions,
}: {
  sessionAnswers?: Mark[];
  marks?: Mark[];
  regions?: ReadonlyMap<Mark, Mark[]>;
}): CorrectedMark[] => {
  const sessionAnswers = sessionAnswersInput || [];
  const correctAnswers = correctAnswersInput || [];
  // Every line is also judged on its solid or dashed style alone, against the key line it lies on or, failing
  // that, the key line in its slot. One drawn on a key line in the other style is wrong for its style alone, and
  // that key line is not reported as missing as well.
  const wrongStyleKeyLines = new Set<Mark>();
  let lineSlot = 0;
  const rez = cloneDeep(sessionAnswers).reduce<CorrectedMark[]>((correctedAnswer, sessionMark) => {
    const answerIsCorrect = correctAnswers.find((mark) => compareMarks(sessionMark, mark, regions));
    const correctness: Correctness = answerIsCorrect ? 'correct' : 'incorrect';
    const answer: CorrectedMark = Object.assign(sessionMark, { correctness });
    if (sessionMark.type === 'line') {
      const keyLines = correctAnswers.filter((mark) => mark.type === 'line');
      const slot = lineSlot++;
      // The key line the student's line stands for: the one it lies on, else the one in the same slot (line A, B)
      const onKeyLine = answerIsCorrect ?? keyLines.find((mark) => equalLinePosition(sessionMark, mark));
      const keyLine = onKeyLine ?? keyLines[slot];
      if (onKeyLine && !answerIsCorrect) {
        wrongStyleKeyLines.add(onKeyLine);
      }
      if (keyLine) {
        answer.lineStyle = (sessionMark.fill ?? 'Solid') === (keyLine.fill ?? 'Solid') ? 'correct' : 'incorrect';
        answer.expectedFill = keyLine.fill;
        answer.onKeyLine = !!onKeyLine;
      }
    }
    return [...correctedAnswer, answer];
  }, []);
  // add missing objects from correct answer; compared before cloning, since regions holds the key's own marks
  const missingAnswers = correctAnswers.reduce<CorrectedMark[]>((correctedAnswer, answer) => {
    const answerIndex = sessionAnswers.find((mark) => compareMarks(mark, answer, regions));
    if (!answerIndex && !wrongStyleKeyLines.has(answer)) {
      // means that corrected answer is missing from session, so we mark it as missing object
      return [...correctedAnswer, { ...cloneDeep(answer), correctness: 'missing' }];
    }
    return correctedAnswer;
  }, []);
  return [...rez, ...missingAnswers];
};

/*
 * Function to get the best answer
 * @param {Object} question - question object
 * @param {Object} session - session object
 * @param {Object} env - env object
 * */
export const getBestAnswer = (
  question: GraphingSolutionSetModel | undefined,
  session: GraphingSolutionSetSession | undefined,
  _env: Partial<PieEnvironment> = {},
): BestAnswer => {
  // questionAnswers contains all possible answers (correct response and alternates);
  const questionAnswers: Record<string, Answer> = question?.answers ?? {};
  const { answer: sessionAnswer } = session || {};
  // filter the incomplete objects
  Object.entries(questionAnswers || {}).forEach(
    ([key, value]) => (questionAnswers[key] = { ...value, marks: value?.marks.filter((mark) => !mark.building) }),
  );
  // initialize answer if no values
  const answer = sessionAnswer || [];
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
      // outcome() passes the stored model, so fall back to the default grid the element draws
      const regions = keyRegionSections(
        marks,
        question?.domain ?? defaults.domain,
        question?.range ?? defaults.range,
        question?.gssLineData?.sections,
      );
      const correctedAnswer = getAnswerCorrected({ sessionAnswers, marks, regions });
      const correctMarks = correctedAnswer.filter((answer) => answer.correctness === 'correct');
      // filter out missing objects because they do not affect the calculation of the score
      // only correct and incorrect are needed
      const scoredCorrectedAnswer = correctedAnswer.filter((answer) => answer.correctness !== 'missing');
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
        acc.bestScore = Math.floor(score / maxScore);
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

/*
 * Constant normalize
 * @param {Object} question - question object
 * */
export const normalize = (question: GraphingSolutionSetModel): GraphingSolutionSetModel => ({ ...defaults, ...question });

/*
 * Function to set model
 * @param {Object} question - question object
 * @param {Object} session - session object
 * @param {Object} env - env object
 * */
export function model(
  question: GraphingSolutionSetModel,
  session: GraphingSolutionSetSession,
  env: PieEnvironment,
): Promise<GraphingSolutionSetViewModel> {
  return new Promise((resolve) => {
    const normalizedQuestion = normalize(question);
    // ensure removing of invalid answers
    // need this if undo redo was last operation
    session.answer = removeInvalidAnswers(session.answer);
    // console.log('normalizedQuestion', normalizedQuestion);
    // `defaultTool` and `toolbarTools` are not model keys; destructuring keeps them out of `questionProps`.
    const { defaultTool, extraCSSRules, prompt, promptEnabled, graph, answers, toolbarTools, gssLineData, ...questionProps } =
      normalizedQuestion as GraphingSolutionSetModel & { defaultTool?: unknown; toolbarTools?: unknown };
    let { arrows } = normalizedQuestion;
    const mode = env?.mode;
    const role = env?.role;
    const includeAnswers = mode === 'evaluate' || role === 'instructor';

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

    const base: GraphingSolutionSetViewModel = {
      ...questionProps,
      // The answer key reaches the browser only once it may show it. `gssLineData` carries the key's lines, fills
      // and sections, so a gathering student gets only the line count.
      ...(includeAnswers
        ? { answers, gssLineData }
        : gssLineData && { gssLineData: { numberOfLines: gssLineData.numberOfLines } }),
      arrows,
      defaultTool: 'line',
      disabled: env.mode !== 'gather',
      prompt: promptEnabled ? prompt : null,
      rationale: null,
      size: graph,
      showToggle:
        env.mode === 'evaluate' &&
        !isEmpty(answers) &&
        answers.correctAnswer &&
        answers.correctAnswer.marks &&
        !isEmpty(answers.correctAnswer.marks),
      showKeyLegend: env.mode === 'evaluate',
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
        base.answersCorrected = answersCorrected;
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

/*
 * Function to check the outcome
 * @param {Object} question - question object
 * @param {Object} session - session object
 * @param {Object} env - env object
 * */
export function outcome(
  question: GraphingSolutionSetModel,
  session: GraphingSolutionSetSession | undefined,
  env: Partial<PieEnvironment> = {},
) {
  return new Promise<{ score: number; empty?: boolean }>((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true });
    }
    if (
      env.mode !== 'evaluate' ||
      isEmpty(question.answers) ||
      (question.answers && question.answers.correctAnswer && isEmpty(question.answers.correctAnswer.marks))
    ) {
      resolve({ score: 0 });
    }
    const { bestScore } = getBestAnswer(question, session, env);
    resolve({ score: bestScore });
  });
}

/*
 * Constant to create correct response session
 * @param {Object} question - question object
 * @param {Object} env - env object
 * */
export const createCorrectResponseSession = (question: GraphingSolutionSetModel, env: PieEnvironment) => {
  return new Promise<GraphingSolutionSetSession | null>((resolve) => {
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

/*
 * Constant to validate model before saving item
 * @param {Object} model - model object
 * */
export const validate = (model: Partial<GraphingSolutionSetModel> = {}): GraphingSolutionSetValidationErrors => {
  // Read unguarded: validate throws on a model without answers or gssLineData.
  const { answers, gssLineData } = model as Required<Pick<GraphingSolutionSetModel, 'answers' | 'gssLineData'>>;
  const errors: GraphingSolutionSetValidationErrors = {};
  const correctAnswerErrors: Record<string, string> = {};
  let found = false;
  if (gssLineData.numberOfLines === 1) {
    if (answers.correctAnswer.marks.length < 1) {
      found = true;
      correctAnswerErrors.correctAnswer = 'At least 1 line object should be defined.';
    } else if (answers.correctAnswer.marks.length === 1 && answers.correctAnswer.marks[0].building) {
      found = true;
      correctAnswerErrors.correctAnswer = '1 or more graph object should be correctly defined.';
    }
  } else {
    if (answers.correctAnswer.marks.length < 2) {
      found = true;
      correctAnswerErrors.correctAnswer = 'At least 2 line object should be defined.';
    } else if (answers.correctAnswer.marks.length === 2) {
      if (answers.correctAnswer.marks[0].building || answers.correctAnswer.marks[1].building) {
        found = true;
        correctAnswerErrors.correctAnswer = '1 or more graph object should be correctly defined.';
      }
    }
  }
  const polygon = answers.correctAnswer.marks.find((mark) => mark.type === 'polygon');
  // `!selectedTool` is a boolean, so this comparison is always false and the check reduces to `!polygon`.
  if (!found && ((!gssLineData.selectedTool as unknown) === 'solutionSet' || !polygon)) {
    correctAnswerErrors.correctAnswer = 'Please select a solution set for the graphing solution set item.';
  }
  if (!isEmpty(correctAnswerErrors)) {
    errors.correctAnswerErrors = correctAnswerErrors;
  }
  return errors;
};
