const get_tree = (expr_or_tree: any) => {
  if (expr_or_tree === undefined || expr_or_tree === null) return undefined;
  return expr_or_tree.tree !== undefined ? expr_or_tree.tree : expr_or_tree;
};

const is_associative: Record<string, boolean> = {
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

  operands = operands.map((v: any) => flatten(v));

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
