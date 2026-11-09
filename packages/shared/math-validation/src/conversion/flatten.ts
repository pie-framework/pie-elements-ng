import { get_tree } from './util';

export var is_associative: Record<string, boolean> = {
  '+': true,
  '*': true,
  and: true,
  or: true,
  union: true,
  intersect: true,
};

export function flatten(expr: any): any {
  // flatten tree with all associative operators

  var tree = get_tree(expr);

  if (!Array.isArray(tree)) return tree;

  var operator = tree[0];
  var operands = tree.slice(1);

  operands = operands.map(function (v: any) {
    return flatten(v);
  });

  if (is_associative[operator]) {
    let result: any[] = [];

    for (let i = 0; i < operands.length; i++) {
      if (Array.isArray(operands[i]) && operands[i][0] === operator) {
        result = result.concat(operands[i].slice(1));
      } else {
        result.push(operands[i]);
      }
    }

    operands = result;
  }

  return [operator].concat(operands);
}

export const unflattenRight = function (expr: any): any {
  // unflatten tree with associate operators
  // into a right heavy tree;

  var tree = get_tree(expr);

  if (!Array.isArray(tree)) return tree;

  var operator = tree[0];
  var operands = tree.slice(1);

  operands = operands.map(function (v: any) {
    return unflattenRight(v);
  });

  if (operands.length > 2 && is_associative[operator]) {
    let result = [operator, operands[0], undefined];
    let next = result;

    for (let i = 1; i < operands.length - 1; i++) {
      next[2] = [operator, operands[i], undefined];
      next = next[2];
    }

    next[2] = operands[operands.length - 1];

    return result;
  }

  return [operator].concat(operands);
};

export const unflattenLeft = function (expr: any): any {
  // unflatten tree with associate operator op
  // into a left heavy tree;

  var tree = get_tree(expr);

  if (!Array.isArray(tree)) return tree;

  var operator = tree[0];
  var operands = tree.slice(1);

  operands = operands.map(function (v: any) {
    return unflattenLeft(v);
  });

  if (operands.length > 2 && is_associative[operator]) {
    let result = [operator, undefined, operands[operands.length - 1]];
    let next = result;

    for (let i = operands.length - 2; i > 0; i--) {
      next[1] = [operator, undefined, operands[i]];
      next = next[1];
    }

    next[1] = operands[0];

    return result;
  }

  return [operator].concat(operands);
};

export const allChildren = function (tree: any): any[] {
  // find all children of operator of tree as though it had been flattened

  if (!Array.isArray(tree)) return [];

  var operator = tree[0];
  var operands = tree.slice(1);

  if (!is_associative[operator]) return operands;

  return operands.reduce(function (a: any[], b: any) {
    if (Array.isArray(b) && b[0] === operator) {
      return a.concat(allChildren(b));
    } else return a.concat([b]);
  }, []);
};
