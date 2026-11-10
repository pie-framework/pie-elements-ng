import { mathjs, type ExpressionNode } from '../mathjs.js';
import {
  expressionsCanBeCompared,
  haveSameElements,
  getVariables,
  transformEqualityInExpression,
  getCoefficients,
  solveLinearEquation,
} from './utils.js';

const m: any = mathjs;

export type NodePair = {
  left: ExpressionNode;
  right: ExpressionNode;
};

export type Range = {
  min: number;
  max: number;
};

const operation = (signName: string) => {
  switch (signName) {
    case 'smaller':
      return '<';
    case 'smallerEq':
      return '<=';
    case 'larger':
      return '>';
    case 'largerEq':
      return '>=';
    case 'equal':
      return '==';
    case 'unequal':
      return '!=';
  }
};

// splitInequality takes in a RelationalNode with 2 conditionals and 3 params and returns 2 operatorNodes each containing a 2-way inequality
export const splitInequality = (compoundInequality: any): NodePair => ({
  left: new m.OperatorNode(
    operation(compoundInequality.conditionals[0]),
    compoundInequality.conditionals[0],
    [compoundInequality.params[0], compoundInequality.params[1]]
  ),
  right: new m.OperatorNode(
    operation(compoundInequality.conditionals[1]),
    compoundInequality.conditionals[1],
    [compoundInequality.params[1], compoundInequality.params[2]]
  ),
});

const solve = (inequality: ExpressionNode) =>
  solveLinearEquation(getCoefficients(transformEqualityInExpression(inequality), true))!;

// the interval between the solutions of the two inequalities
export const getInterval = ({ left, right }: NodePair): Range => {
  const a = solve(right);
  const b = solve(left);

  return { min: Math.min(a, b), max: Math.max(a, b) };
};

export const compareCompoundInequations = (firstInequation: any, secondInequation: any) => {
  if (!expressionsCanBeCompared(firstInequation, secondInequation)) {
    return false;
  }

  const firstInequalityVariablesName = getVariables(firstInequation);
  const secondInequalityVariablesName = getVariables(secondInequation);

  if (
    !haveSameElements(firstInequalityVariablesName, secondInequalityVariablesName) &&
    firstInequalityVariablesName?.length === 1
  ) {
    return false;
  }

  const firstInequalities = splitInequality(firstInequation);
  const secondInequalities = splitInequality(secondInequation);

  // find out interval for inequality solution;
  // it does not matter whether we have an open, or half-open/half-close interval, the signs are already compared and at this point they match
  const firstInequalitiesSolution = getInterval(firstInequalities);
  const secondInequalitiesSolution = getInterval(secondInequalities);

  // if interval limits are the same for both inequalities then we can say that inequalities are equivalent
  return (
    firstInequalitiesSolution.min === secondInequalitiesSolution.min &&
    firstInequalitiesSolution.max === secondInequalitiesSolution.max
  );
};
