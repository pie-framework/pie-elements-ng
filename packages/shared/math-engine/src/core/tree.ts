export class TreeNode<T = unknown> {
  public id: string;
  public value: T;
  public parent: TreeNode<T> | null = null;
  public children: Array<TreeNode<T>> = [];

  constructor(id: string, value: T) {
    this.id = id;
    this.value = value;
  }

  append(child: TreeNode<T>): TreeNode<T> {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(child: TreeNode<T>): void {
    this.children = this.children.filter((entry) => entry !== child);
    child.parent = null;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  walk(visitor: (node: TreeNode<T>) => void): void {
    visitor(this);
    this.children.forEach((child) => {
      child.walk(visitor);
    });
  }
}

export function createRoot<T>(value: T): TreeNode<T> {
  return new TreeNode<T>('root', value);
}
